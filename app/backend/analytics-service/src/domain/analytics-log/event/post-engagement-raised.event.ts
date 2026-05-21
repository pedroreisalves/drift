import { DomainEvent } from '@drift/shared';

interface PostEngagementRaisedEventPayload extends Record<string, unknown> {
  postId: string;
  viewCount: number;
  windowHours: number;
  raisedAt: string;
}

export default class PostEngagementRaisedEvent extends DomainEvent<PostEngagementRaisedEventPayload> {
  readonly eventName = 'PostEngagementRaised';
  readonly payload: PostEngagementRaisedEventPayload;

  constructor(payload: PostEngagementRaisedEventPayload) {
    super();
    this.payload = payload;
  }
}
