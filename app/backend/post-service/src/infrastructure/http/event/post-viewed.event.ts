import { DomainEvent } from '@drift/shared';

interface PostViewedEventPayload extends Record<string, unknown> {
  postId: string;
  clientHash: string;
  viewedAt: string;
}

export default class PostViewedEvent extends DomainEvent<PostViewedEventPayload> {
  readonly eventName = 'PostViewed';
  readonly payload: PostViewedEventPayload;

  constructor(payload: PostViewedEventPayload) {
    super();
    this.payload = payload;
  }
}
