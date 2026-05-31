import { DomainEvent } from '@drift/shared';

interface PostCreatedEventPayload extends Record<string, unknown> {
  postId: string;
  clientHash: string;
  clientName: string;
  title: string;
  body: string;
  createdAt: string;
}

export default class PostCreatedEvent extends DomainEvent<PostCreatedEventPayload> {
  readonly eventName = 'PostCreated';
  readonly payload: PostCreatedEventPayload;

  constructor(payload: PostCreatedEventPayload) {
    super();
    this.payload = payload;
  }
}
