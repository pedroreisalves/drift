import { uuidv7 } from 'uuidv7';
import Post from '../../../domain/post/entity/post.aggregate';
import type CreatePostCommand from './create-post.command';
import PostId from '../../../domain/post/value-object/post-id.value-object';
import ClientId from '../../../domain/post/value-object/client-id.value-object';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type EventDispatcher from '../../@shared/interface/event-dispatcher.interface';
import type Logger from '../../@shared/interface/logger.interface';

export default class CreatePostHandler {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const postId = new PostId(uuidv7());
    const clientId = new ClientId(command.clientId);

    const post = Post.create({
      id: postId,
      clientId,
      clientName: command.clientName,
      title: command.title,
      body: command.body,
    });

    await this.postRepository.save(post);

    this.logger.info('Post created', {
      postId: postId.toString(),
      clientId: clientId.toString(),
    });

    const events = post.getDomainEvents();

    for (const event of events) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();

    return postId.toString();
  }
}
