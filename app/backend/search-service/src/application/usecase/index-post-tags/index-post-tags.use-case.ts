import { PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import type { IndexPostTagsInputDto } from './index-post-tags.input-dto';
import PostTagsIndexedEvent from '../../../domain/search-entry/event/post-tags-indexed.event';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';

export default class IndexPostTagsUseCase {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: IndexPostTagsInputDto): Promise<void> {
    const postId = new PostId(input.postId);
    const entry = await this.searchEntryRepository.findByPostId(postId);

    if (!entry) {
      throw new DocumentNotFoundError(input.postId);
    }

    entry.updateTags({ tags: input.tags });

    try {
      await this.searchEntryRepository.update(entry);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new IndexingFailedError(reason);
    }

    const indexedAt = new Date().toISOString();

    this.logger.info('Post tags indexed', {
      postId: input.postId,
      tagCount: input.tags.length,
    });

    await this.eventDispatcher.dispatch(
      new PostTagsIndexedEvent({ postId: input.postId, tags: input.tags, indexedAt }),
    );
  }
}
