import type { UpdatePostTagsInputDto } from './update-post-tags.input-dto';
import { PostId } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import { type EventDispatcher } from '@drift/shared';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import { type Logger } from '@drift/shared';

export default class UpdatePostTagsUseCase {
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

    const events = post.getDomainEvents();

    for (const event of events) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
