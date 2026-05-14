import { type DomainEvent } from '@drift/shared';

interface PostCreatedEventPayload extends Record<string, unknown> {
  postId: string;
  clientId: string;
  clientName: string;
  title: string;
  body: string;
  createdAt: string;
}

export default class PostCreatedEvent implements DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: PostCreatedEventPayload;

  constructor(eventPayload: PostCreatedEventPayload) {
    this.eventName = 'PostCreated';
    this.occurredAt = new Date();
    this.payload = eventPayload;
  }
}
