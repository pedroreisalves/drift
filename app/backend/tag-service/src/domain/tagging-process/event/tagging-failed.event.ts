import type DomainEvent from '../../@shared/interface/domain-event.interface';

export interface TaggingFailedEventPayload extends Record<string, unknown> {
  taggingProcessId: string;
  postId: string;
  retryCount: number;
  reason: string;
  failedAt: string;
}

export default class TaggingFailedEvent implements DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: TaggingFailedEventPayload;

  constructor(eventPayload: TaggingFailedEventPayload) {
    this.eventName = 'TaggingFailed';
    this.occurredAt = new Date();
    this.payload = eventPayload;
  }
}
