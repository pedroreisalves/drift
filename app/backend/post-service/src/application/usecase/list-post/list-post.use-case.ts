import type PostRepository from '../../../domain/post/repository/post.repository';
import type { ListPostInputDto, ListPostOutputDto } from './list-post.dto';
import { type Logger, type UseCase } from '@drift/shared';
import { toListPostOutputDto } from './list-post.mapper';

export default class ListPostUseCase implements UseCase<ListPostInputDto, ListPostOutputDto[]> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: ListPostInputDto): Promise<ListPostOutputDto[]> {
    const limit = input.limit ?? 10;
    const offset = input.offset ?? 0;

    const posts = await this.postRepository.findAll({ limit, offset, featured: input.featured });

    this.logger.info('Posts listed', { count: posts.length, limit, offset });

    return posts.map((post) => toListPostOutputDto(post));
  }
}
