import DomainEvent from '../../@shared/interface/domain-event.interface';

interface PostTagsUpdatedEventPayload extends Record<string, unknown> {
  postId: string;
  clientId: string;
  tags: string[];
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
