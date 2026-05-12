import type EventHandler from '../@shared/interface/event-handler.interface';
import TagPostCommand from '../command/tag-post/tag-post.command';
import type TagPostHandler from '../command/tag-post/tag-post.handler';
import type Logger from '../@shared/interface/logger.interface';

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
    private readonly tagPostHandler: TagPostHandler,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostChangedMessage): Promise<void> {
    const { postId, title, body, createdAt, updatedAt } = event.payload;
    const postUpdatedAt = (updatedAt ?? createdAt) as string;

    this.logger.info('Received post changed event', {
      eventName: event.eventName,
      postId,
    });

    const command = new TagPostCommand(postId, title, body, postUpdatedAt);
    await this.tagPostHandler.execute(command);
  }
}
