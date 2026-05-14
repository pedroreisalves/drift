import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostDTO from '../../@shared/dto/post.dto';
import PostMapper from '../../@shared/dto/post.mapper';
import type ListPostQuery from './list-post.query';
import { type Logger } from '@drift/shared';

export default class ListPostHandler {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly logger: Logger,
  ) {}

  async execute(query: ListPostQuery): Promise<PostDTO[]> {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;

    const posts = await this.postRepository.findAll({ limit, offset });

    this.logger.info('Posts listed', { count: posts.length, limit, offset });

    return posts.map((post) => PostMapper.toDTO(post));
  }
}
