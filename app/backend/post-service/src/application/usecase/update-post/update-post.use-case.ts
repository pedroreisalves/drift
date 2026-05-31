import { ClientId, type EventDispatcher, type Logger, PostId, type UseCase } from '@drift/shared';

import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostFeaturedRepository from '../../../domain/post/repository/post-featured.repository';
import type PostLockRepository from '../../../domain/post/repository/post-lock.repository';
import { POST_LOCK_TYPE } from '../../../domain/post/repository/post-lock.repository';
import { ForbiddenPostOperationError } from '../../@shared/error/forbidden-post-update.error';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import TaggingInProgressError from '../../@shared/error/tagging-in-progress.error';
import type { UpdatePostInputDto } from './update-post.dto';

export default class UpdatePostUseCase implements UseCase<UpdatePostInputDto, void> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly postLockRepository: PostLockRepository,
    private readonly postFeaturedRepository: PostFeaturedRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: UpdatePostInputDto): Promise<void> {
    const postId = new PostId(input.postId);
    const clientId = new ClientId(input.clientId);

    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: postId.toString() });
      throw new PostNotFoundError(postId.toString());
    }

    if (!post.clientId.equals(clientId)) {
      this.logger.warn('Forbidden post update attempt', {
        postId: postId.toString(),
        clientId: clientId.toString(),
      });
      throw new ForbiddenPostOperationError(clientId.toString(), postId.toString(), 'update');
    }

    const isLockedByTagging = await this.postLockRepository.isLocked(
      postId,
      POST_LOCK_TYPE.TAGGING,
    );

    if (isLockedByTagging) {
      this.logger.warn('Post update rejected: tagging in progress', { postId: postId.toString() });
      throw new TaggingInProgressError(postId.toString());
    }

    post.update({ title: input.title, body: input.body });

    const wasFeatured = post.isFeatured;
    if (wasFeatured) {
      post.demote('post_updated');
    }

    await this.postRepository.save(post);

    await this.postLockRepository.lock(postId, POST_LOCK_TYPE.TAGGING);

    if (wasFeatured) {
      await this.postFeaturedRepository.delete(postId);
    }

    this.logger.info('Post updated', { postId: postId.toString() });

    for (const event of post.getDomainEvents()) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
