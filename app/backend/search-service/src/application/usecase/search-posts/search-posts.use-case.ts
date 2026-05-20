import { type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type { SearchPostsInputDto } from './search-posts.input-dto';
import type SearchPostsOutputDto from './search-posts.output-dto';
import SearchPostsMapper from './search-posts.mapper';
import PostSearchedEvent from '../../../domain/search-entry/event/post-searched.event';

export default class SearchPostsUseCase {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: SearchPostsInputDto): Promise<SearchPostsOutputDto[]> {
    const limit = input.limit ?? 10;
    const offset = input.offset ?? 0;

    const results = await this.searchEntryRepository.search({ q: input.q, limit, offset });

    const searchedAt = new Date().toISOString();

    this.logger.info('Posts searched', { q: input.q, resultCount: results.length, limit, offset });

    await this.eventDispatcher.dispatch(
      new PostSearchedEvent({
        query: input.q,
        clientId: input.clientId,
        resultCount: results.length,
        searchedAt,
      }),
    );

    return results.map((entry) => SearchPostsMapper.toOutputDto(entry));
  }
}
