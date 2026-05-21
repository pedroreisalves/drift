import type { UpdatePostInputDto } from './update-post.input-dto';
import { PostId } from '@drift/shared';
import { ClientId } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import { POST_LOCK_TYPE } from '../../@shared/constant/post-lock.constant';
import { type EventDispatcher } from '@drift/shared';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import { ForbiddenPostOperationError } from '../../@shared/error/forbidden-post-update.error';
import TaggingInProgressError from '../../@shared/error/tagging-in-progress.error';
import { type Logger } from '@drift/shared';

export default class UpdatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly postLockRepository: PostLockRepository,
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
      postId.toString(),
      POST_LOCK_TYPE.TAGGING,
    );

    if (isLockedByTagging) {
      this.logger.warn('Post update rejected: tagging in progress', { postId: postId.toString() });
      throw new TaggingInProgressError(postId.toString());
    }

    post.update({ title: input.title, body: input.body });

    await this.postRepository.save(post);

    this.logger.info('Post updated', { postId: postId.toString() });

    const events = post.getDomainEvents();

    for (const event of events) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
