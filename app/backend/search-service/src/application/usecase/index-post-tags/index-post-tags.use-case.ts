import { PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type { IndexPostTagsInputDto } from './index-post-tags.input-dto';
import PostTagsIndexedEvent from '../../../domain/search-entry/event/post-tags-indexed.event';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

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

    await this.searchEntryRepository.update(entry);

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
