import type { GetPostInputDto, GetPostOutputDto } from './get-post.dto';
import { PostId, type Logger, type UseCase } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import { toPostOutputFields } from '../../@shared/dto/post-output.mapper';

export default class GetPostUseCase implements UseCase<GetPostInputDto, GetPostOutputDto> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: GetPostInputDto): Promise<GetPostOutputDto> {
    const postId = new PostId(input.postId);
    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: input.postId });
      throw new PostNotFoundError(input.postId);
    }

    return toPostOutputFields(post);
  }
}
