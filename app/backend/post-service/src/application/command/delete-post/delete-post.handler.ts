import { PostId } from '@drift/shared';
import { ClientId } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import { type EventDispatcher } from '@drift/shared';
import type DeletePostCommand from './delete-post.command';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import ForbiddenPostUpdateError from '../../@shared/error/forbidden-post-update.error';
import { type Logger } from '@drift/shared';

export default class DeletePostHandler {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const postId = new PostId(command.postId);
    const clientId = new ClientId(command.clientId);

    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: postId.toString() });
      throw new PostNotFoundError(postId.toString());
    }

    if (!post.clientId.equals(clientId)) {
      this.logger.warn('Forbidden post delete attempt', {
        postId: postId.toString(),
        clientId: clientId.toString(),
      });
      throw new ForbiddenPostUpdateError(postId.toString(), clientId.toString());
    }

    post.delete();

    await this.postRepository.delete(postId);

    this.logger.info('Post deleted', { postId: postId.toString() });

    for (const event of post.getDomainEvents()) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
