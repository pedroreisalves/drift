import { z } from 'zod';
import { type EventHandler, type Logger } from '@drift/shared';
import type UpdateSearchEntryFeaturedStatusUseCase from '../../usecase/update-search-entry-featured-status/update-search-entry-featured-status.use-case';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

export const postDemotedMessageSchema = z.object({
  eventName: z.literal('PostDemoted'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    demotedAt: z.iso.datetime(),
    reason: z.string(),
  }),
});

export type PostDemotedMessage = z.infer<typeof postDemotedMessageSchema>;

export default class PostDemotedEventHandler implements EventHandler {
  constructor(
    private readonly updateSearchEntryFeaturedStatusUseCase: UpdateSearchEntryFeaturedStatusUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postDemotedMessageSchema.parse(raw);
    const { postId } = event.payload;

    this.logger.info('Received PostDemoted event, clearing featured flag', { postId });

    try {
      await this.updateSearchEntryFeaturedStatusUseCase.execute({ postId, isFeatured: false });
    } catch (error: unknown) {
      if (error instanceof DocumentNotFoundError) {
        this.logger.warn('Dropping PostDemoted event: entry no longer exists', { postId });
        return;
      }
      throw error;
    }
  }
}
