import { type EventHandler, type Logger } from '@drift/shared';
import type IndexPostTagsUseCase from '../../usecase/index-post-tags/index-post-tags.use-case';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

export interface PostTagsUpdatedMessage {
  eventName: string;
  occurredAt: string;
  payload: {
    postId: string;
    tags: string[];
    updatedAt: string;
  };
}

export default class PostTagsUpdatedEventHandler implements EventHandler<PostTagsUpdatedMessage> {
  constructor(
    private readonly indexPostTagsUseCase: IndexPostTagsUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostTagsUpdatedMessage): Promise<void> {
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
