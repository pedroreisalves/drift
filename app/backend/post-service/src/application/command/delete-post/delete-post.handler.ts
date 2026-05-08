import PostId from '../../../domain/post/value-object/post-id.value-object';
import PostRepository from '../../../domain/post/repository/post.repository';
import EventDispatcher from '../../@shared/interface/event-dispatcher.interface';
import DeletePostCommand from './delete-post.command';
import PostDeletedEvent from './post-deleted.event';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

export default class DeletePostHandler {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const postId = new PostId(command.postId);

    const post = await this.postRepository.findById(postId);

    if (!post) {
      throw new PostNotFoundError(postId.toString());
    }

    await this.postRepository.delete(postId);

    const event = new PostDeletedEvent({
      postId: postId.toString(),
      clientId: command.clientId,
      deletedAt: new Date().toISOString(),
    });

    await this.eventDispatcher.dispatch(event);
  }
}
