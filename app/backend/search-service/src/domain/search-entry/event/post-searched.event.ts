import { DomainEvent } from '@drift/shared';

interface PostSearchedEventPayload extends Record<string, unknown> {
  query: string;
  clientId: string;
  resultCount: number;
  searchedAt: string;
}

export default class PostSearchedEvent extends DomainEvent<PostSearchedEventPayload> {
  readonly eventName = 'PostSearched';
  readonly payload: PostSearchedEventPayload;

  constructor(payload: PostSearchedEventPayload) {
    super();
    this.payload = payload;
  }
}
