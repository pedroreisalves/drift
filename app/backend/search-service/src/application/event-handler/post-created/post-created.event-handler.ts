import { type EventHandler, type Logger } from '@drift/shared';
import IndexPostCommand from '../../command/index-post/index-post.command';
import type IndexPostHandler from '../../command/index-post/index-post.handler';

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
    private readonly indexPostHandler: IndexPostHandler,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostCreatedMessage): Promise<void> {
    const { postId, title, body } = event.payload;

    this.logger.info('Received PostCreated event, indexing post', { postId });

    const command = new IndexPostCommand(postId, title, body);
    await this.indexPostHandler.execute(command);
  }
}
