import { AggregateRoot, type ClientId, type PostId, sha256Hex } from '@drift/shared';
import { z } from 'zod';

import InvalidPostError from '../error/invalid-post.error';
import EngagementDropFlaggedEvent from '../event/engagement-drop-flagged.event';
import EngagementDropRecoveredEvent from '../event/engagement-drop-recovered.event';
import FeaturedPostRemovedEvent from '../event/featured-post-removed.event';
import PostCreatedEvent from '../event/post-created.event';
import PostDeletedEvent from '../event/post-deleted.event';
import PostDemotedEvent from '../event/post-demoted.event';
import PostPromotedEvent from '../event/post-promoted.event';
import PostTagsUpdatedEvent from '../event/post-tags-updated.event';
import PostUpdatedEvent from '../event/post-updated.event';

interface PostProps {
  id: PostId;
  clientId: ClientId;
  clientName: string;
  title: string;
  body: string;
  tags: string[];
  isFeatured: boolean;
  featuredAt: Date | null;
  engagementDropFlagged: boolean;
  isTaggingInProgress: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostProps {
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

export default class Post extends AggregateRoot {
  private constructor(private readonly props: PostProps) {
    super();
  }

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
    const updatedAt = createdAt;

    const post = new Post({
      ...props,
      tags,
      isFeatured: false,
      featuredAt: null,
      engagementDropFlagged: false,
      isTaggingInProgress: false,
      createdAt,
      updatedAt,
    });

    const event = new PostCreatedEvent({
      postId: props.id.toString(),
      clientHash: sha256Hex(props.clientId.toString()),
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
    this.resetTags();
    this.props.updatedAt = updatedAt;

    const event = new PostUpdatedEvent({
      postId: this.props.id.toString(),
      clientHash: sha256Hex(this.props.clientId.toString()),
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
      throw new InvalidPostError(result.error.issues.map((e) => e.message));
    }

    const updatedAt = new Date();

    this.props.tags = tags;
    this.props.updatedAt = updatedAt;

    const event = new PostTagsUpdatedEvent({
      postId: this.props.id.toString(),
      tags,
      updatedAt: updatedAt.toISOString(),
    });

    this.addDomainEvent(event);
  }

  promote(): void {
    if (this.props.isFeatured) return;

    const updatedAt = new Date();
    this.props.isFeatured = true;
    this.props.featuredAt = updatedAt;
    this.props.updatedAt = updatedAt;

    this.addDomainEvent(
      new PostPromotedEvent({
        postId: this.props.id.toString(),
        promotedAt: updatedAt.toISOString(),
      }),
    );
  }

  recoverEngagement(): void {
    if (!this.props.isFeatured) return;
    if (!this.props.engagementDropFlagged) return;

    const updatedAt = new Date();
    this.props.engagementDropFlagged = false;
    this.props.updatedAt = updatedAt;

    this.addDomainEvent(
      new EngagementDropRecoveredEvent({
        postId: this.props.id.toString(),
        recoveredAt: updatedAt.toISOString(),
      }),
    );
  }

  flagEngagementDrop(): void {
    if (!this.props.isFeatured) return;
    if (this.props.engagementDropFlagged) return;

    const updatedAt = new Date();
    this.props.engagementDropFlagged = true;
    this.props.updatedAt = updatedAt;

    this.addDomainEvent(
      new EngagementDropFlaggedEvent({
        postId: this.props.id.toString(),
        flaggedAt: updatedAt.toISOString(),
      }),
    );
  }

  demote(reason: string): void {
    if (!this.props.isFeatured) {
      throw new InvalidPostError(['Cannot demote a non-featured post']);
    }

    const updatedAt = new Date();
    this.props.isFeatured = false;
    this.props.featuredAt = null;
    this.props.engagementDropFlagged = false;
    this.props.updatedAt = updatedAt;

    this.addDomainEvent(
      new PostDemotedEvent({
        postId: this.props.id.toString(),
        demotedAt: updatedAt.toISOString(),
        reason,
      }),
    );
  }

  removeFeatured(): void {
    if (!this.props.isFeatured) return;

    const updatedAt = new Date();
    this.props.isFeatured = false;
    this.props.featuredAt = null;
    this.props.engagementDropFlagged = false;
    this.props.updatedAt = updatedAt;

    this.addDomainEvent(
      new FeaturedPostRemovedEvent({
        postId: this.props.id.toString(),
        removedAt: updatedAt.toISOString(),
      }),
    );
  }

  delete(): void {
    const event = new PostDeletedEvent({
      postId: this.props.id.toString(),
      clientHash: sha256Hex(this.props.clientId.toString()),
      deletedAt: new Date().toISOString(),
    });

    this.addDomainEvent(event);
  }

  private resetTags(): void {
    this.props.tags = [];
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
    return [...this.props.tags];
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get featuredAt(): Date | null {
    return this.props.featuredAt;
  }

  get engagementDropFlagged(): boolean {
    return this.props.engagementDropFlagged;
  }

  get isTaggingInProgress(): boolean {
    return this.props.isTaggingInProgress;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
