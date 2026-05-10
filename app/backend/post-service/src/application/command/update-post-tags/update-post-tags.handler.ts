import type UpdatePostTagsCommand from './update-post-tags.command';
import PostId from '../../../domain/post/value-object/post-id.value-object';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type EventDispatcher from '../../@shared/interface/event-dispatcher.interface';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import type Logger from '../../@shared/interface/logger.interface';

export default class UpdatePostTagsHandler {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(command: UpdatePostTagsCommand): Promise<void> {
    const postId = new PostId(command.postId);
    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: postId.toString() });
      throw new PostNotFoundError(postId.toString());
    }

    post.applyTags(command.tags);

    await this.postRepository.save(post);

    this.logger.info('Post tags updated', {
      postId: postId.toString(),
      tagCount: command.tags.length,
    });

    const events = post.getDomainEvents();

    for (const event of events) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
