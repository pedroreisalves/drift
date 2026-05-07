import DomainEvent from '../../../domain/@shared/interface/domain-event.interface';

interface PostDeletedEventPayload extends Record<string, unknown> {
  postId: string;
  clientId: string;
  deletedAt: string;
}

export default class PostDeletedEvent implements DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: PostDeletedEventPayload;

  constructor(eventPayload: PostDeletedEventPayload) {
    this.eventName = 'PostDeleted';
    this.occurredAt = new Date();
    this.payload = eventPayload;
  }
}
