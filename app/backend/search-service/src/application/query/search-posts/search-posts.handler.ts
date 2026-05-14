import { type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type SearchPostsQuery from './search-posts.command';
import type SearchEntryDTO from '../../@shared/dto/search-entry.dto';
import SearchEntryMapper from '../../@shared/dto/search-entry.mapper';
import PostSearchedEvent from '../../../domain/search-entry/event/post-searched.event';

export default class SearchPostsHandler {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(query: SearchPostsQuery): Promise<SearchEntryDTO[]> {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;

    const results = await this.searchEntryRepository.search({ q: query.q, limit, offset });

    const searchedAt = new Date().toISOString();

    this.logger.info('Posts searched', { q: query.q, resultCount: results.length, limit, offset });

    await this.eventDispatcher.dispatch(
      new PostSearchedEvent({
        query: query.q,
        clientId: query.clientId,
        resultCount: results.length,
        searchedAt,
      }),
    );

    return results.map((entry) => SearchEntryMapper.toDTO(entry));
  }
}
