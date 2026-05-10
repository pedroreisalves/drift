import type EventHandler from '../@shared/interface/event-handler.interface';
import UpdatePostTagsCommand from '../command/update-post-tags/update-post-tags.command';
import type UpdatePostTagsHandler from '../command/update-post-tags/update-post-tags.handler';
import type Logger from '../@shared/interface/logger.interface';

export interface PostTaggedMessage {
  eventName: string;
  occurredAt: string;
  payload: {
    id: string;
    postId: string;
    tags: string[];
    taggedAt: string;
  };
}

export default class PostTaggedEventHandler implements EventHandler<PostTaggedMessage> {
  constructor(
    private readonly updatePostTagsHandler: UpdatePostTagsHandler,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostTaggedMessage): Promise<void> {
    const { postId, tags } = event.payload;

    this.logger.info('Received post tagged event, applying tags', {
      postId,
      tagCount: tags.length,
    });

    const command = new UpdatePostTagsCommand(postId, tags);
    await this.updatePostTagsHandler.execute(command);
  }
}
