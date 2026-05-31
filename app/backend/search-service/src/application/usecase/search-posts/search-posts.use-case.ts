import { type EventDispatcher, type Logger, type UseCase } from '@drift/shared';

import PostSearchedEvent from '../../../domain/search-entry/event/post-searched.event';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import type { SearchPostsInputDto, SearchPostsOutputDto } from './search-posts.dto';
import { toSearchPostsOutputDto } from './search-posts.mapper';

export default class SearchPostsUseCase implements UseCase<
  SearchPostsInputDto,
  SearchPostsOutputDto[]
> {
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

    if (input.clientHash) {
      this.eventDispatcher
        .dispatch(
          new PostSearchedEvent({
            query: input.q,
            clientHash: input.clientHash,
            resultCount: results.length,
            searchedAt,
          }),
        )
        .catch((err: unknown) => {
          this.logger.warn('Failed to dispatch PostSearchedEvent', {
            error: err instanceof Error ? err.message : String(err),
          });
        });
    }

    return results.map((entry) => toSearchPostsOutputDto(entry));
  }
}
