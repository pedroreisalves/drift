import { type EventHandler, type Logger } from '@drift/shared';
import { z } from 'zod';

import { EventTypeEnum } from '../../../domain/analytics-log/value-object/event-type.value-object';
import type RecordAnalyticsEventUseCase from '../../usecase/record-analytics-event/record-analytics-event.use-case';

export const postCreatedMessageSchema = z.object({
  eventName: z.literal('PostCreated'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    clientId: z.uuidv7(),
    title: z.string(),
    body: z.string(),
    createdAt: z.iso.datetime(),
  }),
});

export type PostCreatedMessage = z.infer<typeof postCreatedMessageSchema>;

export default class PostCreatedEventHandler implements EventHandler {
  constructor(
    private readonly recordAnalyticsEventUseCase: RecordAnalyticsEventUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postCreatedMessageSchema.parse(raw);
    const { postId, clientId, createdAt } = event.payload;

    this.logger.info('Received PostCreated event, recording analytics', { postId, clientId });

    await this.recordAnalyticsEventUseCase.execute({
      eventType: EventTypeEnum.PostCreated,
      postId,
      clientId,
      timestamp: createdAt,
    });
  }
}
