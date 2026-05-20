import { type EventHandler } from '@drift/shared';
import type TagPostUseCase from '../../usecase/tag-post/tag-post.use-case';
import { type Logger } from '@drift/shared';

export interface PostChangedMessage {
  eventName: string;
  occurredAt: string;
  payload: {
    postId: string;
    clientId: string;
    clientName: string;
    title: string;
    body: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export default class PostChangedEventHandler implements EventHandler<PostChangedMessage> {
  constructor(
    private readonly tagPostUseCase: TagPostUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostChangedMessage): Promise<void> {
    const { postId, title, body } = event.payload;

    this.logger.info('Received post changed event', {
      eventName: event.eventName,
      postId,
    });

    await this.tagPostUseCase.execute({ postId, title, body });
  }
}
