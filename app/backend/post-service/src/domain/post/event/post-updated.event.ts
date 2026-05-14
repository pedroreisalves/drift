import { DomainEvent } from '@drift/shared';

interface PostUpdatedEventPayload extends Record<string, unknown> {
  postId: string;
  clientId: string;
  clientName: string;
  title: string;
  body: string;
  updatedAt: string;
}

export default class PostUpdatedEvent extends DomainEvent<PostUpdatedEventPayload> {
  readonly eventName = 'PostUpdated';
  readonly payload: PostUpdatedEventPayload;

  constructor(payload: PostUpdatedEventPayload) {
    super();
    this.payload = payload;
  }
}
