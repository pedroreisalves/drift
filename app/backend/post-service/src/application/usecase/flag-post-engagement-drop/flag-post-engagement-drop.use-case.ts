import { PostId, type EventDispatcher, type Logger, type UseCase } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type { FlagPostEngagementDropInputDto } from './flag-post-engagement-drop.dto';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

export default class FlagPostEngagementDropUseCase implements UseCase<
  FlagPostEngagementDropInputDto,
  void
> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: FlagPostEngagementDropInputDto): Promise<void> {
    const postId = new PostId(input.postId);

    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: postId.toString() });
      throw new PostNotFoundError(postId.toString());
    }

    post.flagEngagementDrop();

    await this.postRepository.save(post);

    this.logger.info('Post engagement drop flagged', { postId: postId.toString() });

    for (const event of post.getDomainEvents()) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
