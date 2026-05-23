import { PostId, type EventDispatcher, type Logger, type UseCase } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type { DemotePostInputDto } from './demote-post.dto';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

export default class DemotePostUseCase implements UseCase<DemotePostInputDto, void> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: DemotePostInputDto): Promise<void> {
    const postId = new PostId(input.postId);

    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: postId.toString() });
      throw new PostNotFoundError(postId.toString());
    }

    post.demote(input.reason);

    await this.postRepository.save(post);

    this.logger.info('Post demoted', { postId: postId.toString(), reason: input.reason });

    for (const event of post.getDomainEvents()) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
