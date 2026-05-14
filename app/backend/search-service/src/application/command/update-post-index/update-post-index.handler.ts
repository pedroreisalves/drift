import { PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type UpdatePostIndexCommand from './update-post-index.command';
import PostIndexedEvent from '../../../domain/search-entry/event/post-indexed.event';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

export default class UpdatePostIndexHandler {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(command: UpdatePostIndexCommand): Promise<void> {
    const postId = new PostId(command.postId);
    const entry = await this.searchEntryRepository.findByPostId(postId);

    if (!entry) {
      throw new DocumentNotFoundError(command.postId);
    }

    entry.updateContent({ title: command.title, body: command.body });

    await this.searchEntryRepository.update(entry);

    const indexedAt = new Date().toISOString();

    this.logger.info('Post index updated', { postId: command.postId });

    await this.eventDispatcher.dispatch(
      new PostIndexedEvent({ postId: command.postId, indexedAt }),
    );
  }
}
