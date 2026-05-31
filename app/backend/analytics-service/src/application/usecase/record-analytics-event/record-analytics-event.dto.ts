import type { EventTypeEnum } from '../../../domain/analytics-log/value-object/event-type.value-object';

export interface RecordAnalyticsEventInputDto {
  eventType: EventTypeEnum;
  postId: string | null;
  clientHash: string;
  timestamp: string;
}
