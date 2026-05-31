import { type EventHandler, type Logger } from '@drift/shared';
import { z } from 'zod';

import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import type UpdatePostIndexUseCase from '../../usecase/update-post-index/update-post-index.use-case';

export const postUpdatedMessageSchema = z.object({
  eventName: z.literal('PostUpdated'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    title: z.string(),
    body: z.string(),
    updatedAt: z.iso.datetime(),
  }),
});

export type PostUpdatedMessage = z.infer<typeof postUpdatedMessageSchema>;

export default class PostUpdatedEventHandler implements EventHandler {
  constructor(
    private readonly updatePostIndexUseCase: UpdatePostIndexUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postUpdatedMessageSchema.parse(raw);
    const { postId, title, body } = event.payload;

    this.logger.info('Received PostUpdated event, updating index', { postId });

    try {
      await this.updatePostIndexUseCase.execute({ postId, title, body });
    } catch (error: unknown) {
      if (error instanceof DocumentNotFoundError) {
        this.logger.warn('Dropping PostUpdated event: entry no longer exists', { postId });
        return;
      }
      throw error;
    }
  }
}
