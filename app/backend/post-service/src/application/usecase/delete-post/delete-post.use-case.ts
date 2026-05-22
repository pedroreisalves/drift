import { PostId, ClientId, type EventDispatcher, type Logger, type UseCase } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type { DeletePostInputDto } from './delete-post.dto';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import { ForbiddenPostOperationError } from '../../@shared/error/forbidden-post-update.error';

export default class DeletePostUseCase implements UseCase<DeletePostInputDto, void> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: DeletePostInputDto): Promise<void> {
    const postId = new PostId(input.postId);
    const clientId = new ClientId(input.clientId);

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
      throw new ForbiddenPostOperationError(clientId.toString(), postId.toString(), 'delete');
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
