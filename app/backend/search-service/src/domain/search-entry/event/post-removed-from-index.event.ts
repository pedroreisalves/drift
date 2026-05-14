import { DomainEvent } from '@drift/shared';

interface PostRemovedFromIndexEventPayload extends Record<string, unknown> {
  postId: string;
  removedAt: string;
}

export default class PostRemovedFromIndexEvent extends DomainEvent<PostRemovedFromIndexEventPayload> {
  readonly eventName = 'PostRemovedFromIndex';
  readonly payload: PostRemovedFromIndexEventPayload;

  constructor(payload: PostRemovedFromIndexEventPayload) {
    super();
    this.payload = payload;
  }
}
