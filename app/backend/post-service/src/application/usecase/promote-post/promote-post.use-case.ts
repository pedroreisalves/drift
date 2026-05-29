import { type EventDispatcher, type Logger, PostId, type UseCase } from '@drift/shared';

import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostFeaturedRepository from '../../../domain/post/repository/post-featured.repository';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import type { PromotePostInputDto } from './promote-post.dto';

export default class PromotePostUseCase implements UseCase<PromotePostInputDto, void> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly postFeaturedRepository: PostFeaturedRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: PromotePostInputDto): Promise<void> {
    const postId = new PostId(input.postId);

    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: postId.toString() });
      throw new PostNotFoundError(postId.toString());
    }

    post.promote();
    post.recoverEngagement();

    await this.postRepository.save(post);
    await this.postFeaturedRepository.save(postId);

    this.logger.info('Post promoted', { postId: postId.toString() });

    for (const event of post.getDomainEvents()) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
