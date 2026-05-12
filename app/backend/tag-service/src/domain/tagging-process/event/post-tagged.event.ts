import type DomainEvent from '../../@shared/interface/domain-event.interface';

interface PostTaggedEventPayload extends Record<string, unknown> {
  taggingProcessId: string;
  postId: string;
  tags: string[];
  taggedAt: string;
  postUpdatedAt: string;
}

export default class PostTaggedEvent implements DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: PostTaggedEventPayload;

  constructor(eventPayload: PostTaggedEventPayload) {
    this.eventName = 'PostTagged';
    this.occurredAt = new Date();
    this.payload = eventPayload;
  }
}
