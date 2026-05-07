import GetPostQuery from './get-post.query';
import PostId from '../../../domain/post/value-object/post-id.value-object';
import PostRepository from '../../../domain/post/repository/post.repository';
import { PostNotFoundError } from '../../@shared/error/post-not-found.error';
import PostDTO from '../../@shared/dto/post.dto';
import PostMapper from '../../@shared/dto/post.mapper';

export default class GetPostHandler {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(query: GetPostQuery): Promise<PostDTO> {
    const postId = new PostId(query.id);
    const post = await this.postRepository.findById(postId);

    if (!post) {
      throw new PostNotFoundError(query.id);
    }

    return PostMapper.toDTO(post);
  }
}
