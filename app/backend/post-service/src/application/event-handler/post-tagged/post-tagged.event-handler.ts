import { type EventHandler } from '@drift/shared';
import { type Logger } from '@drift/shared';
import UpdatePostTagsCommand from '../../command/update-post-tags/update-post-tags.command';
import type UpdatePostTagsHandler from '../../command/update-post-tags/update-post-tags.handler';
import UnlockPostForTaggingCommand from '../../command/unlock-post-for-tagging/unlock-post-for-tagging.command';
import type UnlockPostForTaggingHandler from '../../command/unlock-post-for-tagging/unlock-post-for-tagging.handler';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

export interface PostTaggedMessage {
  eventName: string;
  occurredAt: string;
  payload: {
    taggingProcessId: string;
    postId: string;
    tags: string[];
    taggedAt: string;
  };
}

export default class PostTaggedEventHandler implements EventHandler<PostTaggedMessage> {
  constructor(
    private readonly updatePostTagsHandler: UpdatePostTagsHandler,
    private readonly unlockPostForTaggingHandler: UnlockPostForTaggingHandler,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostTaggedMessage): Promise<void> {
    const { postId, tags } = event.payload;

    this.logger.info('Received post tagged event, applying tags', {
      postId,
      tagCount: tags.length,
    });

    try {
      await this.updatePostTagsHandler.execute(new UpdatePostTagsCommand(postId, tags));
    } catch (error) {
      if (error instanceof PostNotFoundError) {
        this.logger.warn('Dropping PostTagged event: post no longer exists', { postId });
        await this.unlockPostForTaggingHandler.execute(new UnlockPostForTaggingCommand(postId));
        return;
      }
      throw error;
    }

    await this.unlockPostForTaggingHandler.execute(new UnlockPostForTaggingCommand(postId));
  }
}
