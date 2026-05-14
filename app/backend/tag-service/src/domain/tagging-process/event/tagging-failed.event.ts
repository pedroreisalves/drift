import { DomainEvent } from '@drift/shared';

export interface TaggingFailedEventPayload extends Record<string, unknown> {
  taggingProcessId: string;
  postId: string;
  retryCount: number;
  reason: string;
  failedAt: string;
}

export default class TaggingFailedEvent extends DomainEvent<TaggingFailedEventPayload> {
  readonly eventName = 'TaggingFailed';
  readonly payload: TaggingFailedEventPayload;

  constructor(payload: TaggingFailedEventPayload) {
    super();
    this.payload = payload;
  }
}
