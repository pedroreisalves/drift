import { DomainEvent } from '@drift/shared';

export interface TaggingInitializedEventPayload extends Record<string, unknown> {
  taggingProcessId: string;
  postId: string;
  retryCount: number;
  initializedAt: string;
}

export default class TaggingInitializedEvent extends DomainEvent<TaggingInitializedEventPayload> {
  readonly eventName = 'TaggingInitialized';
  readonly payload: TaggingInitializedEventPayload;

  constructor(payload: TaggingInitializedEventPayload) {
    super();
    this.payload = payload;
  }
}
