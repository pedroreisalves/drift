import type DomainEvent from '../../@shared/interface/domain-event.interface';

interface PostUpdatedEventPayload extends Record<string, unknown> {
  postId: string;
  clientId: string;
  clientName: string;
  title: string;
  body: string;
  updatedAt: string;
}

export default class PostUpdatedEvent implements DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: PostUpdatedEventPayload;

  constructor(eventPayload: PostUpdatedEventPayload) {
    this.eventName = 'PostUpdated';
    this.occurredAt = new Date();
    this.payload = eventPayload;
  }
}
