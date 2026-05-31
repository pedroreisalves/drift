import { clientHashSchema, type EventHandler, type Logger } from '@drift/shared';
import { z } from 'zod';

import { EventTypeEnum } from '../../../domain/analytics-log/value-object/event-type.value-object';
import type RecordAnalyticsEventUseCase from '../../usecase/record-analytics-event/record-analytics-event.use-case';

export const postSearchedMessageSchema = z.object({
  eventName: z.literal('PostSearched'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    query: z.string(),
    clientHash: clientHashSchema,
    resultCount: z.number(),
    searchedAt: z.iso.datetime(),
  }),
});

export type PostSearchedMessage = z.infer<typeof postSearchedMessageSchema>;

export default class PostSearchedEventHandler implements EventHandler {
  constructor(
    private readonly recordAnalyticsEventUseCase: RecordAnalyticsEventUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postSearchedMessageSchema.parse(raw);
    const { clientHash, searchedAt } = event.payload;

    this.logger.info('Received PostSearched event, recording analytics', { clientHash });

    await this.recordAnalyticsEventUseCase.execute({
      eventType: EventTypeEnum.PostSearched,
      postId: null,
      clientHash,
      timestamp: searchedAt,
    });
  }
}
