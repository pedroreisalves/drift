import { type EventHandler } from '@drift/shared';
import UpdatePostTagsCommand from '../command/update-post-tags/update-post-tags.command';
import type UpdatePostTagsHandler from '../command/update-post-tags/update-post-tags.handler';
import type PostLockRepository from '../@shared/interface/post-lock.repository';
import { type Logger } from '@drift/shared';
import type PostRepository from '../../domain/post/repository/post.repository';
import { PostId } from '@drift/shared';

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
    private readonly postRepository: PostRepository,
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async handle(event: PostTaggedMessage): Promise<void> {
    const { postId, tags } = event.payload;

    this.logger.info('Received post tagged event, applying tags', {
      postId,
      tagCount: tags.length,
    });

    const post = await this.postRepository.findById(new PostId(postId));

    if (!post) {
      this.logger.warn('Dropping PostTagged event: post no longer exists', { postId });
      await this.postLockRepository.unlock(postId, 'tagging');
      return;
    }

    const command = new UpdatePostTagsCommand(postId, tags);
    await this.updatePostTagsHandler.execute(command);
    await this.postLockRepository.unlock(postId, 'tagging');
  }
}
