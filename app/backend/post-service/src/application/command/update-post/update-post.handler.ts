import type UpdatePostCommand from './update-post.command';
import PostId from '../../../domain/post/value-object/post-id.value-object';
import ClientId from '../../../domain/post/value-object/client-id.value-object';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type EventDispatcher from '../../@shared/interface/event-dispatcher.interface';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import ForbiddenPostUpdateError from '../../@shared/error/forbidden-post-update.error';
import type Logger from '../../@shared/interface/logger.interface';

export default class UpdatePostHandler {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(command: UpdatePostCommand): Promise<void> {
    const postId = new PostId(command.postId);
    const clientId = new ClientId(command.clientId);

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
      throw new ForbiddenPostUpdateError(postId.toString(), clientId.toString());
    }

    post.update({
      title: command.title,
      body: command.body,
    });

    await this.postRepository.save(post);

    this.logger.info('Post updated', { postId: postId.toString() });

    const events = post.getDomainEvents();

    for (const event of events) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
