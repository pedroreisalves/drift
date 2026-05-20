import { PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type { IndexPostInputDto } from './index-post.input-dto';
import PostIndexedEvent from '../../../domain/search-entry/event/post-indexed.event';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';

export default class IndexPostUseCase {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: IndexPostInputDto): Promise<void> {
    const postId = new PostId(input.postId);

    const entry = SearchEntry.create({
      postId,
      title: input.title,
      body: input.body,
      tags: [],
    });

    try {
      await this.searchEntryRepository.index(entry);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new IndexingFailedError(reason);
    }

    const indexedAt = new Date().toISOString();

    this.logger.info('Post indexed', { postId: input.postId });

    await this.eventDispatcher.dispatch(new PostIndexedEvent({ postId: input.postId, indexedAt }));
  }
}
