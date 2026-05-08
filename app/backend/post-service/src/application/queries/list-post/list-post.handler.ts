import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostDTO from '../../@shared/dto/post.dto';
import PostMapper from '../../@shared/dto/post.mapper';
import type ListPostQuery from './list-post.query';

export default class ListPostHandler {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(query: ListPostQuery): Promise<PostDTO[]> {
    const posts = await this.postRepository.findAll({
      limit: query.limit ?? 10,
      offset: query.offset ?? 0,
    });

    return posts.map(PostMapper.toDTO);
  }
}
