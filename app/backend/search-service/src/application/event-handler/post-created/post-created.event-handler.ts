import { type EventHandler, type Logger } from '@drift/shared';
import type IndexPostUseCase from '../../usecase/index-post/index-post.use-case';

export interface PostCreatedMessage {
  eventName: string;
  occurredAt: string;
  payload: {
    postId: string;
    clientId: string;
    clientName: string;
    title: string;
    body: string;
    createdAt: string;
  };
}

export default class PostCreatedEventHandler implements EventHandler<PostCreatedMessage> {
  constructor(
    private readonly indexPostUseCase: IndexPostUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostCreatedMessage): Promise<void> {
    const { postId, title, body } = event.payload;

    this.logger.info('Received PostCreated event, indexing post', { postId });

    await this.indexPostUseCase.execute({ postId, title, body });
  }
}
