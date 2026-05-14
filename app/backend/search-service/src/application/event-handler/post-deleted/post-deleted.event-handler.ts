import { type EventHandler, type Logger } from '@drift/shared';
import RemovePostFromIndexCommand from '../../command/remove-post-from-index/remove-post-from-index.command';
import type RemovePostFromIndexHandler from '../../command/remove-post-from-index/remove-post-from-index.handler';

export interface PostDeletedMessage {
  eventName: string;
  occurredAt: string;
  payload: {
    postId: string;
    clientId: string;
    deletedAt: string;
  };
}

export default class PostDeletedEventHandler implements EventHandler<PostDeletedMessage> {
  constructor(
    private readonly removePostFromIndexHandler: RemovePostFromIndexHandler,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostDeletedMessage): Promise<void> {
    const { postId } = event.payload;

    this.logger.info('Received PostDeleted event, removing from index', { postId });

    const command = new RemovePostFromIndexCommand(postId);
    await this.removePostFromIndexHandler.execute(command);
  }
}
