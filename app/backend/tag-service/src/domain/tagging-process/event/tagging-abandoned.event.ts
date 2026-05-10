import type DomainEvent from '../../@shared/interface/domain-event.interface';

interface TaggingAbandonedEventPayload extends Record<string, unknown> {
  taggingProcessId: string;
  postId: string;
  reason: string;
  retryCount: number;
  abandonedAt: string;
}

export default class TaggingAbandonedEvent implements DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: TaggingAbandonedEventPayload;

  constructor(eventPayload: TaggingAbandonedEventPayload) {
    this.eventName = 'TaggingAbandoned';
    this.occurredAt = new Date();
    this.payload = eventPayload;
  }
}
