import { DomainEvent } from '@drift/shared';

interface PostDemotedEventPayload extends Record<string, unknown> {
  postId: string;
  demotedAt: string;
  reason: string;
}

export default class PostDemotedEvent extends DomainEvent<PostDemotedEventPayload> {
  readonly eventName = 'PostDemoted';
  readonly payload: PostDemotedEventPayload;

  constructor(payload: PostDemotedEventPayload) {
    super();
    this.payload = payload;
  }
}
