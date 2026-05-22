import type PostRepository from '../../../domain/post/repository/post.repository';
import type ListPostOutputDto from './list-post.output-dto';
import ListPostMapper from './list-post.mapper';
import type { ListPostInputDto } from './list-post.input-dto';
import { type Logger, type UseCase } from '@drift/shared';

export default class ListPostUseCase implements UseCase<ListPostInputDto, ListPostOutputDto[]> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: ListPostInputDto): Promise<ListPostOutputDto[]> {
    const limit = input.limit ?? 10;
    const offset = input.offset ?? 0;

    const posts = await this.postRepository.findAll({ limit, offset });

    this.logger.info('Posts listed', { count: posts.length, limit, offset });

    return posts.map((post) => ListPostMapper.toOutputDto(post));
  }
}
