import PostId from '../../../domain/post/value-object/post-id.value-object';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type EventDispatcher from '../../@shared/interface/event-dispatcher.interface';
import type DeletePostCommand from './delete-post.command';
import PostDeletedEvent from './post-deleted.event';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import type Logger from '../../@shared/interface/logger.interface';

export default class DeletePostHandler {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const postId = new PostId(command.postId);

    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: postId.toString() });
      throw new PostNotFoundError(postId.toString());
    }

    await this.postRepository.delete(postId);

    this.logger.info('Post deleted', { postId: postId.toString() });

    const event = new PostDeletedEvent({
      postId: postId.toString(),
      clientId: command.clientId,
      deletedAt: new Date().toISOString(),
    });

    await this.eventDispatcher.dispatch(event);
  }
}
