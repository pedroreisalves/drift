import type { GetPostInputDto } from './get-post.input-dto';
import { PostId } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import type PostDTO from '../../@shared/dto/post.dto';
import PostMapper from '../../@shared/dto/post.mapper';
import { type Logger } from '@drift/shared';

export default class GetPostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: GetPostInputDto): Promise<PostDTO> {
    const postId = new PostId(input.id);
    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: input.id });
      throw new PostNotFoundError(input.id);
    }

    return PostMapper.toDTO(post);
  }
}
