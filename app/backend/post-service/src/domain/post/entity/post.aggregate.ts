import { z } from 'zod';
import DomainEvent from '../../@shared/interface/domain-event.interface';
import PostCreatedEvent from '../event/post-created.event';
import PostTagsUpdated from '../event/post-tags-updated.event';
import PostUpdatedEvent from '../event/post-updated.event';
import ClientId from '../value-object/client-id.value-object';
import PostId from '../value-object/post-id.value-object';
import { InvalidPostError } from '../error/invalid-post.error';
import { InvalidPostTagsError } from '../error/invalid-post-tags.error';

interface PostProps {
  id: PostId;
  clientId: ClientId;
  clientName: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePostProps {
  id: PostId;
  clientId: ClientId;
  clientName: string;
  title: string;
  body: string;
}

const createPostSchema = z
  .object({
    clientName: z.string().nonempty('Client name cannot be empty'),
    title: z
      .string()
      .nonempty('Title cannot be empty')
      .max(45, 'Title cannot exceed 45 characters'),
    body: z
      .string()
      .nonempty('Body cannot be empty')
      .max(2000, 'Body cannot exceed 2000 characters'),
  })
  .strict();

interface UpdatePostProps {
  title?: string;
  body?: string;
}

const updatePostSchema = z
  .object({
    title: z
      .string()
      .nonempty('Title cannot be empty')
      .max(45, 'Title cannot exceed 45 characters')
      .optional(),
    body: z
      .string()
      .nonempty('Body cannot be empty')
      .max(2000, 'Body cannot exceed 2000 characters')
      .optional(),
  })
  .strict()
  .refine((data) => data.title !== undefined || data.body !== undefined, {
    message: "At least one of 'title' or 'body' must be provided",
  });

const applyTagsSchema = z
  .array(z.string().max(45, 'Tag cannot exceed 45 characters').nonempty('Tag cannot be empty'))
  .max(10, 'Cannot have more than 10 tags')
  .refine((tags) => new Set(tags).size === tags.length, {
    message: 'Tags cannot be duplicated',
  });

export default class Post {
  private domainEvents: DomainEvent[] = [];

  private constructor(private props: PostProps) {}

  static reconstruct(props: PostProps): Post {
    return new Post(props);
  }

  static create(props: CreatePostProps): Post {
    const result = createPostSchema.safeParse({
      clientName: props.clientName,
      title: props.title,
      body: props.body,
    });

    if (!result.success) {
      throw new InvalidPostError(result.error.issues.map((e) => e.message));
    }

    const tags: string[] = [];
    const createdAt = new Date();
    const updatedAt = new Date();

    const post = new Post({ ...props, tags, createdAt, updatedAt });

    const event = new PostCreatedEvent({
      postId: props.id.toString(),
      clientId: props.clientId.toString(),
      clientName: props.clientName,
      title: props.title,
      body: props.body,
      createdAt: createdAt.toISOString(),
    });

    post.addDomainEvent(event);

    return post;
  }

  update(props: UpdatePostProps): void {
    const result = updatePostSchema.safeParse({
      title: props.title,
      body: props.body,
    });

    if (!result.success) {
      throw new InvalidPostError(result.error.issues.map((e) => e.message));
    }

    const updatedAt = new Date();

    this.props.title = props.title ?? this.props.title;
    this.props.body = props.body ?? this.props.body;
    this.props.updatedAt = updatedAt;

    this.resetTags();

    const event = new PostUpdatedEvent({
      postId: this.props.id.toString(),
      clientId: this.props.clientId.toString(),
      clientName: this.props.clientName,
      title: this.props.title,
      body: this.props.body,
      updatedAt: updatedAt.toISOString(),
    });

    this.addDomainEvent(event);
  }

  applyTags(tags: string[]): void {
    const result = applyTagsSchema.safeParse(tags);

    if (!result.success) {
      throw new InvalidPostTagsError(result.error.issues.map((e) => e.message));
    }

    this.props.tags = tags;

    const event = new PostTagsUpdated({
      postId: this.props.id.toString(),
      clientId: this.props.clientId.toString(),
      tags,
    });

    this.addDomainEvent(event);
  }

  resetTags(): void {
    this.props.tags = [];
  }

  private addDomainEvent(domainEvent: DomainEvent): void {
    this.domainEvents.push(domainEvent);
  }

  getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  get id(): PostId {
    return this.props.id;
  }

  get clientId(): ClientId {
    return this.props.clientId;
  }

  get clientName(): string {
    return this.props.clientName;
  }

  get title(): string {
    return this.props.title;
  }

  get body(): string {
    return this.props.body;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
