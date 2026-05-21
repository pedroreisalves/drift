import { z } from 'zod';
import { type EventHandler, type Logger } from '@drift/shared';
import type RecordAnalyticsEventUseCase from '../../usecase/record-analytics-event/record-analytics-event.use-case';
import { EventTypeEnum } from '../../../domain/analytics-log/value-object/event-type.value-object';

export const postUpdatedMessageSchema = z.object({
  eventName: z.literal('PostUpdated'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    clientId: z.uuidv7(),
    title: z.string(),
    body: z.string(),
    updatedAt: z.iso.datetime(),
  }),
});

export type PostUpdatedMessage = z.infer<typeof postUpdatedMessageSchema>;

export default class PostUpdatedEventHandler implements EventHandler {
  constructor(
    private readonly recordAnalyticsEventUseCase: RecordAnalyticsEventUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postUpdatedMessageSchema.parse(raw);
    const { postId, clientId, updatedAt } = event.payload;

    this.logger.info('Received PostUpdated event, recording analytics', { postId, clientId });

    await this.recordAnalyticsEventUseCase.execute({
      eventType: EventTypeEnum.PostUpdated,
      postId,
      clientId,
      timestamp: updatedAt,
    });
  }
}
