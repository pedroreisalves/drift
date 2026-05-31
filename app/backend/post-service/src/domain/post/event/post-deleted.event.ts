import { DomainEvent } from '@drift/shared';

interface PostDeletedEventPayload extends Record<string, unknown> {
  postId: string;
  clientHash: string;
  deletedAt: string;
}

export default class PostDeletedEvent extends DomainEvent<PostDeletedEventPayload> {
  readonly eventName = 'PostDeleted';
  readonly payload: PostDeletedEventPayload;

  constructor(payload: PostDeletedEventPayload) {
    super();
    this.payload = payload;
  }
}
