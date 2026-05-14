import { DomainEvent } from '@drift/shared';

interface PostTagsIndexedEventPayload extends Record<string, unknown> {
  postId: string;
  tags: string[];
  indexedAt: string;
}

export default class PostTagsIndexedEvent extends DomainEvent<PostTagsIndexedEventPayload> {
  readonly eventName = 'PostTagsIndexed';
  readonly payload: PostTagsIndexedEventPayload;

  constructor(payload: PostTagsIndexedEventPayload) {
    super();
    this.payload = payload;
  }
}
