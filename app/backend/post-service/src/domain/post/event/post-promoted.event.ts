import { DomainEvent } from '@drift/shared';

interface PostPromotedEventPayload extends Record<string, unknown> {
  postId: string;
  promotedAt: string;
}

export default class PostPromotedEvent extends DomainEvent<PostPromotedEventPayload> {
  readonly eventName = 'PostPromoted';
  readonly payload: PostPromotedEventPayload;

  constructor(payload: PostPromotedEventPayload) {
    super();
    this.payload = payload;
  }
}
