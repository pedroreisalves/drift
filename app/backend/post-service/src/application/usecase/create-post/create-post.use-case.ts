import { uuidv7 } from 'uuidv7';
import Post from '../../../domain/post/entity/post.aggregate';
import type { CreatePostInputDto, CreatePostOutputDto } from './create-post.dto';
import { toCreatePostOutputDto } from './create-post.mapper';
import { PostId, ClientId, type EventDispatcher, type Logger, type UseCase } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';

export default class CreatePostUseCase implements UseCase<CreatePostInputDto, CreatePostOutputDto> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: CreatePostInputDto): Promise<CreatePostOutputDto> {
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

    for (const event of post.getDomainEvents()) {
      await this.eventDispatcher.dispatch(event);
    }

    post.clearDomainEvents();

    return toCreatePostOutputDto(post);
  }
}
