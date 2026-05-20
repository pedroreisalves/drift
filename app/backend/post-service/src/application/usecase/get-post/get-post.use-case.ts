import type { GetPostInputDto } from './get-post.input-dto';
import { PostId } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import type GetPostOutputDto from './get-post.output-dto';
import GetPostMapper from './get-post.mapper';
import { type Logger } from '@drift/shared';

export default class GetPostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: GetPostInputDto): Promise<GetPostOutputDto> {
    const postId = new PostId(input.id);
    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: input.id });
      throw new PostNotFoundError(input.id);
    }

    return GetPostMapper.toOutputDto(post);
  }
}
