import { z } from 'zod';
import { type EventHandler } from '@drift/shared';
import { type Logger } from '@drift/shared';
import type UnlockPostForTaggingUseCase from '../../usecase/unlock-post-for-tagging/unlock-post-for-tagging.use-case';

export const taggingAbandonedMessageSchema = z.object({
  eventName: z.literal('TaggingAbandoned'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    taggingProcessId: z.uuidv7(),
    postId: z.uuidv7(),
    retryCount: z.number(),
    reason: z.string(),
    abandonedAt: z.iso.datetime(),
  }),
});

export type TaggingAbandonedMessage = z.infer<typeof taggingAbandonedMessageSchema>;

export default class TaggingAbandonedEventHandler implements EventHandler {
  constructor(
    private readonly unlockPostForTaggingUseCase: UnlockPostForTaggingUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = taggingAbandonedMessageSchema.parse(raw);
    const { postId } = event.payload;

    await this.unlockPostForTaggingUseCase.execute({ postId });

    this.logger.info('TaggingAbandoned handled', { postId });
  }
}
