import { z } from 'zod';
import { type EventHandler, type Logger } from '@drift/shared';
import type UpdateSearchEntryTaggingStatusUseCase from '../../usecase/update-search-entry-tagging-status/update-search-entry-tagging-status.use-case';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

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
    private readonly updateSearchEntryTaggingStatusUseCase: UpdateSearchEntryTaggingStatusUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = taggingAbandonedMessageSchema.parse(raw);
    const { postId } = event.payload;

    this.logger.info('Received TaggingAbandoned event, clearing tagging flag', { postId });

    try {
      await this.updateSearchEntryTaggingStatusUseCase.execute({
        postId,
        isTaggingInProgress: false,
      });
    } catch (error: unknown) {
      if (error instanceof DocumentNotFoundError) {
        this.logger.warn('Dropping TaggingAbandoned event: entry no longer exists', { postId });
        return;
      }
      throw error;
    }
  }
}
