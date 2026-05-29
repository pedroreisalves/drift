import { type EventHandler, type Logger } from '@drift/shared';
import { z } from 'zod';

import type ExecuteTaggingUseCase from '../../usecase/execute-tagging/execute-tagging.use-case';

export const taggingFailedMessageSchema = z.object({
  eventName: z.literal('TaggingFailed'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    taggingProcessId: z.uuidv7(),
    postId: z.uuidv7(),
    retryCount: z.number(),
    reason: z.string(),
    failedAt: z.iso.datetime(),
  }),
});

export type TaggingFailedMessage = z.infer<typeof taggingFailedMessageSchema>;

export default class TaggingFailedEventHandler implements EventHandler {
  constructor(
    private readonly executeTaggingUseCase: ExecuteTaggingUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = taggingFailedMessageSchema.parse(raw);
    const { taggingProcessId, postId, retryCount, reason } = event.payload;

    this.logger.info('Received tagging failed event, scheduling retry', {
      taggingProcessId,
      postId,
      retryCount,
      reason,
    });

    await this.executeTaggingUseCase.execute({ taggingProcessId });
  }
}
