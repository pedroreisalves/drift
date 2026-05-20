import { uuidv7 } from 'uuidv7';
import Post from '../../../domain/post/entity/post.aggregate';
import type { CreatePostInputDto } from './create-post.input-dto';
import { PostId } from '@drift/shared';
import { ClientId } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import { type EventDispatcher } from '@drift/shared';
import { type Logger } from '@drift/shared';

export default class CreatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: CreatePostInputDto): Promise<string> {
    const postId = new PostId(uuidv7());
    const clientId = new ClientId(input.clientId);

    const post = Post.create({
      id: postId,
      clientId,
      clientName: input.clientName,
      title: input.title,
      body: input.body,
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
