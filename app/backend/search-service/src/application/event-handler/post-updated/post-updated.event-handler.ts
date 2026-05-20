import { type EventHandler, type Logger } from '@drift/shared';
import type UpdatePostIndexUseCase from '../../usecase/update-post-index/update-post-index.use-case';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

export interface PostUpdatedMessage {
  eventName: string;
  occurredAt: string;
  payload: {
    postId: string;
    clientId: string;
    clientName: string;
    title: string;
    body: string;
    updatedAt: string;
  };
}

export default class PostUpdatedEventHandler implements EventHandler<PostUpdatedMessage> {
  constructor(
    private readonly updatePostIndexUseCase: UpdatePostIndexUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostUpdatedMessage): Promise<void> {
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
