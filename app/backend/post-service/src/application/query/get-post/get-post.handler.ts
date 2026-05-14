import type GetPostQuery from './get-post.query';
import { PostId } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import type PostDTO from '../../@shared/dto/post.dto';
import PostMapper from '../../@shared/dto/post.mapper';
import { type Logger } from '@drift/shared';

export default class GetPostHandler {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly logger: Logger,
  ) {}

  async execute(query: GetPostQuery): Promise<PostDTO> {
    const postId = new PostId(query.id);
    const post = await this.postRepository.findById(postId);

    if (!post) {
      this.logger.error('Post not found', { postId: query.id });
      throw new PostNotFoundError(query.id);
    }

    return PostMapper.toDTO(post);
  }
}
