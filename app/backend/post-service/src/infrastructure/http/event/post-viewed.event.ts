import type DomainEvent from '../../../domain/@shared/interface/domain-event.interface';

interface PostViewedEventPayload extends Record<string, unknown> {
  postId: string;
  clientId: string;
  viewedAt: string;
}

export default class PostViewedEvent implements DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: PostViewedEventPayload;

  constructor(eventPayload: PostViewedEventPayload) {
    this.eventName = 'PostViewed';
    this.occurredAt = new Date();
    this.payload = eventPayload;
  }
}
