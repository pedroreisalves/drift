import { DomainEvent } from '@drift/shared';

interface EngagementDropRecoveredEventPayload extends Record<string, unknown> {
  postId: string;
  recoveredAt: string;
}

export default class EngagementDropRecoveredEvent extends DomainEvent<EngagementDropRecoveredEventPayload> {
  readonly eventName = 'EngagementDropRecovered';
  readonly payload: EngagementDropRecoveredEventPayload;

  constructor(payload: EngagementDropRecoveredEventPayload) {
    super();
    this.payload = payload;
  }
}
