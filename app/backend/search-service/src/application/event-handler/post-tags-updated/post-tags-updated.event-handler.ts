import { z } from 'zod';
import { type EventHandler, type Logger } from '@drift/shared';
import type IndexPostTagsUseCase from '../../usecase/index-post-tags/index-post-tags.use-case';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

export const postTagsUpdatedMessageSchema = z.object({
  eventName: z.literal('PostTagsUpdated'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    tags: z.array(z.string()),
    updatedAt: z.iso.datetime(),
  }),
});

export type PostTagsUpdatedMessage = z.infer<typeof postTagsUpdatedMessageSchema>;

export default class PostTagsUpdatedEventHandler implements EventHandler {
  constructor(
    private readonly indexPostTagsUseCase: IndexPostTagsUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postTagsUpdatedMessageSchema.parse(raw);
    const { postId, tags } = event.payload;

    this.logger.info('Received PostTagsUpdated event, indexing tags', { postId });

    try {
      await this.indexPostTagsUseCase.execute({ postId, tags });
    } catch (error: unknown) {
      if (error instanceof DocumentNotFoundError) {
        this.logger.warn('Dropping PostTagsUpdated event: entry no longer exists', { postId });
        return;
      }
      throw error;
    }
  }
}
