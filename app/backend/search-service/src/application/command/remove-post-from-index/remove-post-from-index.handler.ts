import { PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type RemovePostFromIndexCommand from './remove-post-from-index.command';
import PostRemovedFromIndexEvent from '../../../domain/search-entry/event/post-removed-from-index.event';

export default class RemovePostFromIndexHandler {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(command: RemovePostFromIndexCommand): Promise<void> {
    await this.searchEntryRepository.remove(new PostId(command.postId));

    const removedAt = new Date().toISOString();

    this.logger.info('Post removed from index', { postId: command.postId });

    await this.eventDispatcher.dispatch(
      new PostRemovedFromIndexEvent({ postId: command.postId, removedAt }),
    );
  }
}
