import { DomainEvent } from '@drift/shared';

interface PostTaggedEventPayload extends Record<string, unknown> {
  taggingProcessId: string;
  postId: string;
  tags: string[];
  taggedAt: string;
}

export default class PostTaggedEvent extends DomainEvent<PostTaggedEventPayload> {
  readonly eventName = 'PostTagged';
  readonly payload: PostTaggedEventPayload;

  constructor(payload: PostTaggedEventPayload) {
    super();
    this.payload = payload;
  }
}
