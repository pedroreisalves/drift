import { type EventHandler, type Logger } from '@drift/shared';
import UpdatePostIndexCommand from '../../command/update-post-index/update-post-index.command';
import type UpdatePostIndexHandler from '../../command/update-post-index/update-post-index.handler';
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
    private readonly updatePostIndexHandler: UpdatePostIndexHandler,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostUpdatedMessage): Promise<void> {
    const { postId, title, body } = event.payload;

    this.logger.info('Received PostUpdated event, updating index', { postId });

    try {
      const command = new UpdatePostIndexCommand(postId, title, body);
      await this.updatePostIndexHandler.execute(command);
    } catch (error: unknown) {
      if (error instanceof DocumentNotFoundError) {
        this.logger.warn('Dropping PostUpdated event: entry no longer exists', { postId });
        return;
      }
      throw error;
    }
  }
}
