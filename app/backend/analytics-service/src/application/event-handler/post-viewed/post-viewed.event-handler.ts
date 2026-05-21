import { z } from 'zod';
import { type EventHandler, type Logger } from '@drift/shared';
import type RecordAnalyticsEventUseCase from '../../usecase/record-analytics-event/record-analytics-event.use-case';
import { EventTypeEnum } from '../../../domain/analytics-log/value-object/event-type.value-object';

export const postViewedMessageSchema = z.object({
  eventName: z.literal('PostViewed'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    clientId: z.uuidv7(),
    viewedAt: z.iso.datetime(),
  }),
});

export type PostViewedMessage = z.infer<typeof postViewedMessageSchema>;

export default class PostViewedEventHandler implements EventHandler {
  constructor(
    private readonly recordAnalyticsEventUseCase: RecordAnalyticsEventUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postViewedMessageSchema.parse(raw);
    const { postId, clientId, viewedAt } = event.payload;

    this.logger.info('Received PostViewed event, recording analytics', { postId, clientId });

    await this.recordAnalyticsEventUseCase.execute({
      eventType: EventTypeEnum.PostViewed,
      postId,
      clientId,
      timestamp: viewedAt,
    });
  }
}
