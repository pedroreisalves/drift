import { DomainEvent } from '@drift/shared';

interface TaggingAbandonedEventPayload extends Record<string, unknown> {
  taggingProcessId: string;
  postId: string;
  reason: string;
  retryCount: number;
  abandonedAt: string;
}

export default class TaggingAbandonedEvent extends DomainEvent<TaggingAbandonedEventPayload> {
  readonly eventName = 'TaggingAbandoned';
  readonly payload: TaggingAbandonedEventPayload;

  constructor(payload: TaggingAbandonedEventPayload) {
    super();
    this.payload = payload;
  }
}
