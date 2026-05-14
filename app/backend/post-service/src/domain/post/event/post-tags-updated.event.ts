import { DomainEvent } from '@drift/shared';

interface PostTagsUpdatedEventPayload extends Record<string, unknown> {
  postId: string;
  tags: string[];
  updatedAt: string;
}

export default class PostTagsUpdated extends DomainEvent<PostTagsUpdatedEventPayload> {
  readonly eventName = 'PostTagsUpdated';
  readonly payload: PostTagsUpdatedEventPayload;

  constructor(payload: PostTagsUpdatedEventPayload) {
    super();
    this.payload = payload;
  }
}
