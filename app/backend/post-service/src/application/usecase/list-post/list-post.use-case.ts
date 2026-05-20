import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostDTO from '../../@shared/dto/post.dto';
import PostMapper from '../../@shared/dto/post.mapper';
import type { ListPostInputDto } from './list-post.input-dto';
import { type Logger } from '@drift/shared';

export default class ListPostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: ListPostInputDto): Promise<PostDTO[]> {
    const limit = input.limit ?? 10;
    const offset = input.offset ?? 0;

    const posts = await this.postRepository.findAll({ limit, offset });

    this.logger.info('Posts listed', { count: posts.length, limit, offset });

    return posts.map((post) => PostMapper.toDTO(post));
  }
}
