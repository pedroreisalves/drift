import { DomainEvent } from '@drift/shared';

interface PostIndexedEventPayload extends Record<string, unknown> {
  postId: string;
  indexedAt: string;
}

export default class PostIndexedEvent extends DomainEvent<PostIndexedEventPayload> {
  readonly eventName = 'PostIndexed';
  readonly payload: PostIndexedEventPayload;

  constructor(payload: PostIndexedEventPayload) {
    super();
    this.payload = payload;
  }
}
