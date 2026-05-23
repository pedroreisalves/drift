import { DomainEvent } from '@drift/shared';

interface EngagementDropFlaggedEventPayload extends Record<string, unknown> {
  postId: string;
  flaggedAt: string;
}

export default class EngagementDropFlaggedEvent extends DomainEvent<EngagementDropFlaggedEventPayload> {
  readonly eventName = 'EngagementDropFlagged';
  readonly payload: EngagementDropFlaggedEventPayload;

  constructor(payload: EngagementDropFlaggedEventPayload) {
    super();
    this.payload = payload;
  }
}
