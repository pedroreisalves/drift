import { PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type IndexPostCommand from './index-post.command';
import PostIndexedEvent from '../../../domain/search-entry/event/post-indexed.event';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';

export default class IndexPostHandler {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(command: IndexPostCommand): Promise<void> {
    const postId = new PostId(command.postId);

    const entry = SearchEntry.create({
      postId,
      title: command.title,
      body: command.body,
      tags: [],
    });

    try {
      await this.searchEntryRepository.index(entry);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new IndexingFailedError(reason);
    }

    const indexedAt = new Date().toISOString();

    this.logger.info('Post indexed', { postId: command.postId });

    await this.eventDispatcher.dispatch(new PostIndexedEvent({ postId: command.postId, indexedAt }));
  }
}
