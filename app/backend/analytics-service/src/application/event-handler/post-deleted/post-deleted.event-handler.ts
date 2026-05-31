import { clientHashSchema, type EventHandler, type Logger } from '@drift/shared';
import { z } from 'zod';

import { EventTypeEnum } from '../../../domain/analytics-log/value-object/event-type.value-object';
import type RecordAnalyticsEventUseCase from '../../usecase/record-analytics-event/record-analytics-event.use-case';

export const postDeletedMessageSchema = z.object({
  eventName: z.literal('PostDeleted'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    clientHash: clientHashSchema,
    deletedAt: z.iso.datetime(),
  }),
});

export type PostDeletedMessage = z.infer<typeof postDeletedMessageSchema>;

export default class PostDeletedEventHandler implements EventHandler {
  constructor(
    private readonly recordAnalyticsEventUseCase: RecordAnalyticsEventUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postDeletedMessageSchema.parse(raw);
    const { postId, clientHash, deletedAt } = event.payload;

    this.logger.info('Received PostDeleted event, recording analytics', { postId, clientHash });

    await this.recordAnalyticsEventUseCase.execute({
      eventType: EventTypeEnum.PostDeleted,
      postId,
      clientHash,
      timestamp: deletedAt,
    });
  }
}
