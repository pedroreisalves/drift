import { type EventDispatcher, type Logger, PostId, type UseCase } from '@drift/shared';

import type PostRepository from '../../../domain/post/repository/post.repository';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import type { UpdatePostTagsInputDto } from './update-post-tags.dto';

export default class UpdatePostTagsUseCase implements UseCase<UpdatePostTagsInputDto, void> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: UpdatePostTagsInputDto): Promise<void> {
    const postId = new PostId(input.postId);
    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: postId.toString() });
      throw new PostNotFoundError(postId.toString());
    }

    post.applyTags(input.tags);

    await this.postRepository.save(post);

    this.logger.info('Post tags updated', {
      postId: postId.toString(),
      tagCount: input.tags.length,
    });

    for (const event of post.getDomainEvents()) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
