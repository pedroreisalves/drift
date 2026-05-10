import type DomainEvent from '../../@shared/interface/domain-event.interface';

export interface TaggingInitializedEventPayload extends Record<string, unknown> {
  taggingProcessId: string;
  postId: string;
  retryCount: number;
  initializedAt: string;
}

export default class TaggingInitializedEvent implements DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: TaggingInitializedEventPayload;

  constructor(eventPayload: TaggingInitializedEventPayload) {
    this.eventName = 'TaggingInitialized';
    this.occurredAt = new Date();
    this.payload = eventPayload;
  }
}
