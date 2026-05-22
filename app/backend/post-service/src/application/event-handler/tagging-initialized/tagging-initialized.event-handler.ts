import { z } from 'zod';
import { type EventHandler, type Logger } from '@drift/shared';
import type LockPostForTaggingUseCase from '../../usecase/lock-post-for-tagging/lock-post-for-tagging.use-case';

export const taggingInitializedMessageSchema = z.object({
  eventName: z.literal('TaggingInitialized'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    taggingProcessId: z.uuidv7(),
    postId: z.uuidv7(),
    retryCount: z.number(),
    initializedAt: z.iso.datetime(),
  }),
});

export type TaggingInitializedMessage = z.infer<typeof taggingInitializedMessageSchema>;

export default class TaggingInitializedEventHandler implements EventHandler {
  constructor(
    private readonly lockPostForTaggingUseCase: LockPostForTaggingUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = taggingInitializedMessageSchema.parse(raw);
    const { postId } = event.payload;

    this.logger.info('Received TaggingInitialized event, locking post', { postId });

    await this.lockPostForTaggingUseCase.execute({ postId });
  }
}
