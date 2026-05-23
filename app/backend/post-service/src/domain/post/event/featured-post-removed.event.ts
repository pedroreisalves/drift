import { DomainEvent } from '@drift/shared';

interface FeaturedPostRemovedEventPayload extends Record<string, unknown> {
  postId: string;
  removedAt: string;
}

export default class FeaturedPostRemovedEvent extends DomainEvent<FeaturedPostRemovedEventPayload> {
  readonly eventName = 'FeaturedPostRemoved';
  readonly payload: FeaturedPostRemovedEventPayload;

  constructor(payload: FeaturedPostRemovedEventPayload) {
    super();
    this.payload = payload;
  }
}
