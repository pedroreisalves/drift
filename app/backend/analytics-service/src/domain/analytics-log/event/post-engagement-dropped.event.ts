import { DomainEvent } from '@drift/shared';

interface PostEngagementDroppedEventPayload extends Record<string, unknown> {
  postId: string;
  viewCount: number;
  windowHours: number;
  droppedAt: string;
}

export default class PostEngagementDroppedEvent extends DomainEvent<PostEngagementDroppedEventPayload> {
  readonly eventName = 'PostEngagementDropped';
  readonly payload: PostEngagementDroppedEventPayload;

  constructor(payload: PostEngagementDroppedEventPayload) {
    super();
    this.payload = payload;
  }
}
