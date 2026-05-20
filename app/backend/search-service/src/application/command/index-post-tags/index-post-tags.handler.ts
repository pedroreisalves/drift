import { PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type IndexPostTagsCommand from './index-post-tags.command';
import PostTagsIndexedEvent from '../../../domain/search-entry/event/post-tags-indexed.event';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

export default class IndexPostTagsHandler {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(command: IndexPostTagsCommand): Promise<void> {
    const postId = new PostId(command.postId);
    const entry = await this.searchEntryRepository.findByPostId(postId);

    if (!entry) {
      throw new DocumentNotFoundError(command.postId);
    }

    entry.updateTags({ tags: command.tags });

    await this.searchEntryRepository.update(entry);

    const indexedAt = new Date().toISOString();

    this.logger.info('Post tags indexed', {
      postId: command.postId,
      tagCount: command.tags.length,
    });

    await this.eventDispatcher.dispatch(
      new PostTagsIndexedEvent({ postId: command.postId, tags: command.tags, indexedAt }),
    );
  }
}
