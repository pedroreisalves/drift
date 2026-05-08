import type EventHandler from '../@shared/interface/event-handler.interface';
import UpdatePostTagsCommand from '../command/update-post-tags/update-post-tags.command';
import type UpdatePostTagsHandler from '../command/update-post-tags/update-post-tags.handler';

interface PostTaggedMessage {
  eventName: string;
  occurredAt: string;
  payload: {
    postId: string;
    tags: string[];
    taggedAt: string;
  };
}

export default class PostTaggedEventHandler implements EventHandler<PostTaggedMessage> {
  constructor(private readonly updatePostTagsHandler: UpdatePostTagsHandler) {}

  async handle(event: PostTaggedMessage): Promise<void> {
    const command = new UpdatePostTagsCommand(event.payload.postId, event.payload.tags);
    await this.updatePostTagsHandler.execute(command);
  }
}
