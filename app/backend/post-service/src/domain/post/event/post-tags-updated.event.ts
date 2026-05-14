import { type DomainEvent } from '@drift/shared';

interface PostTagsUpdatedEventPayload extends Record<string, unknown> {
  postId: string;
  tags: string[];
  updatedAt: string;
}

export default class PostTagsUpdated implements DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: PostTagsUpdatedEventPayload;

  constructor(eventPayload: PostTagsUpdatedEventPayload) {
    this.eventName = 'PostTagsUpdated';
    this.occurredAt = new Date();
    this.payload = eventPayload;
  }
}
