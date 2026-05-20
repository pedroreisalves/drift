import { type EventHandler, type Logger } from '@drift/shared';
import type RemovePostFromIndexUseCase from '../../usecase/remove-post-from-index/remove-post-from-index.use-case';

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
    private readonly removePostFromIndexUseCase: RemovePostFromIndexUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostDeletedMessage): Promise<void> {
    const { postId } = event.payload;

    this.logger.info('Received PostDeleted event, removing from index', { postId });

    await this.removePostFromIndexUseCase.execute({ postId });
  }
}
