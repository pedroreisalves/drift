import type UpdatePostTagsCommand from './update-post-tags.command';
import PostId from '../../../domain/post/value-object/post-id.value-object';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type EventDispatcher from '../../@shared/interface/event-dispatcher.interface';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

export default class UpdatePostTagsHandler {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute(command: UpdatePostTagsCommand): Promise<void> {
    const postId = new PostId(command.postId);
    const post = await this.postRepository.findById(postId);

    if (!post) {
      throw new PostNotFoundError(postId.toString());
    }

    post.applyTags(command.tags);

    await this.postRepository.save(post);

    const events = post.getDomainEvents();

    for (const event of events) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();
  }
}
