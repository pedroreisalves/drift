import { z } from 'zod';
import { type EventHandler, type Logger } from '@drift/shared';
import type RemovePostFromIndexUseCase from '../../usecase/remove-post-from-index/remove-post-from-index.use-case';

export const postDeletedMessageSchema = z.object({
  eventName: z.literal('PostDeleted'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    clientId: z.uuidv7(),
    deletedAt: z.iso.datetime(),
  }),
});

export type PostDeletedMessage = z.infer<typeof postDeletedMessageSchema>;

export default class PostDeletedEventHandler implements EventHandler {
  constructor(
    private readonly removePostFromIndexUseCase: RemovePostFromIndexUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postDeletedMessageSchema.parse(raw);
    const { postId } = event.payload;

    this.logger.info('Received PostDeleted event, removing from index', { postId });

    await this.removePostFromIndexUseCase.execute({ postId });
  }
}
