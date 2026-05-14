import { AggregateRoot } from '@drift/shared';
import InvalidTaggingProcessError from '../error/invalid-tagging-process.error';
import PostTaggedEvent from '../event/post-tagged.event';
import TaggingAbandonedEvent from '../event/tagging-abandoned.event';
import TaggingFailedEvent from '../event/tagging-failed.event';
import TaggingInitializedEvent from '../event/tagging-initialized.event';
import { type PostId } from '@drift/shared';
import type TaggingProcessId from '../value-object/tagging-process-id.value-object';
import TaggingStatus from '../value-object/tagging-status.value-object';

import { z } from 'zod';

interface TaggingProcessProps {
  id: TaggingProcessId;
  postId: PostId;
  retryCount: number;
  reason: string | null;
  body: string;
  status: TaggingStatus;
  tags: string[];
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaggingProcessProps {
  id: TaggingProcessId;
  title: string;
  body: string;
  postId: PostId;
}

const createTaggingProcessSchema = z
  .object({
    id: z.uuidv7('Invalid Tagging Process ID format'),
    title: z
      .string()
      .nonempty('Title cannot be empty')
      .max(45, 'Title cannot exceed 45 characters'),
    body: z
      .string()
      .nonempty('Body cannot be empty')
      .max(2000, 'Body cannot exceed 2000 characters'),
    postId: z.uuidv7('Invalid Post ID format'),
  })
  .strict();

interface SucceedTaggingProcessProps {
  tags: string[];
}

const succeedTaggingProcessSchema = z
  .object({
    tags: z
      .array(z.string().max(45, 'Tag cannot exceed 45 characters').nonempty('Tag cannot be empty'))
      .max(10, 'Cannot have more than 10 tags')
      .refine((tags) => new Set(tags).size === tags.length, {
        message: 'Tags cannot be duplicated',
      }),
  })
  .strict();

interface FailedTaggingProcessProps {
  reason: string;
}

const failedTaggingProcessSchema = z
  .object({
    reason: z.string().nonempty('Reason cannot be empty'),
  })
  .strict();

export default class TaggingProcess extends AggregateRoot {
  private constructor(private props: TaggingProcessProps) {
    super();
  }

  static reconstruct(props: TaggingProcessProps): TaggingProcess {
    return new TaggingProcess(props);
  }

  static create(props: CreateTaggingProcessProps): TaggingProcess {
    const result = createTaggingProcessSchema.safeParse({
      id: props.id.toString(),
      title: props.title,
      body: props.body,
      postId: props.postId.toString(),
    });

    if (!result.success) {
      throw new InvalidTaggingProcessError(result.error.issues.map((e) => e.message));
    }

    const createdAt = new Date();
    const updatedAt = new Date();

    const taggingProcess = new TaggingProcess({
      ...props,
      reason: null,
      retryCount: 0,
      status: new TaggingStatus('initialized'),
      tags: [],
      createdAt,
      updatedAt,
    });

    const event = new TaggingInitializedEvent({
      taggingProcessId: props.id.toString(),
      postId: props.postId.toString(),
      retryCount: 0,
      initializedAt: createdAt.toISOString(),
    });

    taggingProcess.addDomainEvent(event);

    return taggingProcess;
  }

  succeed(props: SucceedTaggingProcessProps): void {
    const result = succeedTaggingProcessSchema.safeParse({
      tags: props.tags,
    });

    if (!result.success) {
      throw new InvalidTaggingProcessError(result.error.issues.map((e) => e.message));
    }

    const updatedAt = new Date();
    const taggedAt = new Date();

    this.props.updatedAt = updatedAt;
    this.props.status = new TaggingStatus('tagged');
    this.props.reason = null;
    this.props.tags = props.tags;

    const event = new PostTaggedEvent({
      taggingProcessId: this.props.id.toString(),
      postId: this.props.postId.toString(),
      tags: props.tags,
      taggedAt: taggedAt.toISOString(),
    });

    this.addDomainEvent(event);
  }

  fail(props: FailedTaggingProcessProps): void {
    const result = failedTaggingProcessSchema.safeParse({
      reason: props.reason,
    });

    if (!result.success) {
      throw new InvalidTaggingProcessError(result.error.issues.map((e) => e.message));
    }

    const updatedAt = new Date();

    this.props.updatedAt = updatedAt;
    this.props.reason = props.reason;

    if (!this.hasRetryAttemptsLeft) {
      this.props.status = new TaggingStatus('abandoned');

      const taggingAbandonedEvent = new TaggingAbandonedEvent({
        taggingProcessId: this.props.id.toString(),
        postId: this.props.postId.toString(),
        reason: props.reason,
        retryCount: this.props.retryCount,
        abandonedAt: updatedAt.toISOString(),
      });

      this.addDomainEvent(taggingAbandonedEvent);

      return;
    }

    this.increaseRetryCounter();

    this.props.status = new TaggingStatus('failed');

    const taggingFailedEvent = new TaggingFailedEvent({
      taggingProcessId: this.props.id.toString(),
      postId: this.props.postId.toString(),
      reason: props.reason,
      retryCount: this.props.retryCount,
      failedAt: updatedAt.toISOString(),
    });

    this.addDomainEvent(taggingFailedEvent);
  }

  private get hasRetryAttemptsLeft(): boolean {
    return this.props.retryCount < 3;
  }

  private increaseRetryCounter(): void {
    this.props.retryCount += 1;
  }

  get id(): TaggingProcessId {
    return this.props.id;
  }

  get postId(): PostId {
    return this.props.postId;
  }

  get retryCount(): number {
    return this.props.retryCount;
  }

  get status(): TaggingStatus {
    return this.props.status;
  }

  get reason(): string | null {
    return this.props.reason;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get title(): string {
    return this.props.title;
  }

  get body(): string {
    return this.props.body;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
