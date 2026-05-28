import { z } from 'zod';
import { type EventHandler, type Logger } from '@drift/shared';
import type UpdateSearchEntryFeaturedStatusUseCase from '../../usecase/update-search-entry-featured-status/update-search-entry-featured-status.use-case';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

export const postPromotedMessageSchema = z.object({
  eventName: z.literal('PostPromoted'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    promotedAt: z.iso.datetime(),
  }),
});

export type PostPromotedMessage = z.infer<typeof postPromotedMessageSchema>;

export default class PostPromotedEventHandler implements EventHandler {
  constructor(
    private readonly updateSearchEntryFeaturedStatusUseCase: UpdateSearchEntryFeaturedStatusUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postPromotedMessageSchema.parse(raw);
    const { postId } = event.payload;

    this.logger.info('Received PostPromoted event, flagging entry as featured', { postId });

    try {
      await this.updateSearchEntryFeaturedStatusUseCase.execute({ postId, isFeatured: true });
    } catch (error: unknown) {
      if (error instanceof DocumentNotFoundError) {
        this.logger.warn('Dropping PostPromoted event: entry no longer exists', { postId });
        return;
      }
      throw error;
    }
  }
}
