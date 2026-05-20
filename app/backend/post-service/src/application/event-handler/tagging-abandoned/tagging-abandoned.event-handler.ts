import { z } from 'zod';
import { type EventHandler } from '@drift/shared';
import { type Logger } from '@drift/shared';
import UnlockPostForTaggingCommand from '../../command/unlock-post-for-tagging/unlock-post-for-tagging.command';
import type UnlockPostForTaggingHandler from '../../command/unlock-post-for-tagging/unlock-post-for-tagging.handler';

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
    private readonly unlockPostForTaggingHandler: UnlockPostForTaggingHandler,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = taggingAbandonedMessageSchema.parse(raw);
    const { postId } = event.payload;

    await this.unlockPostForTaggingHandler.execute(new UnlockPostForTaggingCommand(postId));

    this.logger.info('TaggingAbandoned handled', { postId });
  }
}
