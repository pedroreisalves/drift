import { DomainEvent } from '@drift/shared';

interface AnalyticsEventRecordedEventPayload extends Record<string, unknown> {
  eventType: string;
  postId: string | null;
  clientHash: string;
  timestamp: string;
}

export default class AnalyticsEventRecordedEvent extends DomainEvent<AnalyticsEventRecordedEventPayload> {
  readonly eventName = 'AnalyticsEventRecorded';
  readonly payload: AnalyticsEventRecordedEventPayload;

  constructor(payload: AnalyticsEventRecordedEventPayload) {
    super();
    this.payload = payload;
  }
}
