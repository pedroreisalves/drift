import { postIdSchema, type ClientId, type PostId } from '@drift/shared';
import type AnalyticsLogId from '../value-object/analytics-log-id.value-object';
import type EventType from '../value-object/event-type.value-object';
import { EventTypeEnum, eventTypeSchema } from '../value-object/event-type.value-object';
import { z } from 'zod';
import InvalidAnalyticsLogError from '../error/invalid-analytics-log.error';

interface AnalyticsLogProps {
  id: AnalyticsLogId;
  eventType: EventType;
  postId: PostId | null;
  clientId: ClientId;
  timestamp: Date;
}

export interface CreateAnalyticsLogProps {
  id: AnalyticsLogId;
  eventType: EventType;
  postId: PostId | null;
  clientId: ClientId;
  timestamp: Date;
}

const createAnalyticsLogSchema = z
  .object({
    timestamp: z.date({ message: 'Timestamp must be a valid date' }),
    eventType: eventTypeSchema,
    postId: postIdSchema.nullable(),
  })
  .strict()
  .refine((data) => data.eventType === EventTypeEnum.PostSearched || data.postId !== null, {
    message: 'This event type must include a postId',
  });

export default class AnalyticsLog {
  private constructor(private props: AnalyticsLogProps) {}

  static reconstruct(props: AnalyticsLogProps): AnalyticsLog {
    return new AnalyticsLog(props);
  }

  static create(props: CreateAnalyticsLogProps): AnalyticsLog {
    const result = createAnalyticsLogSchema.safeParse({
      timestamp: props.timestamp,
      eventType: props.eventType.toString(),
      postId: props.postId?.toString() ?? null,
    });

    if (!result.success) {
      throw new InvalidAnalyticsLogError(result.error.issues.map((e) => e.message));
    }

    const analyticsLog = new AnalyticsLog({
      id: props.id,
      eventType: props.eventType,
      clientId: props.clientId,
      postId: props.postId,
      timestamp: props.timestamp,
    });

    return analyticsLog;
  }

  get id(): AnalyticsLogId {
    return this.props.id;
  }

  get eventType(): EventType {
    return this.props.eventType;
  }

  get clientId(): ClientId {
    return this.props.clientId;
  }

  get postId(): PostId | null {
    return this.props.postId;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }
}
