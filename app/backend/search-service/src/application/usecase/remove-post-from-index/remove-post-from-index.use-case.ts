import { PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type { RemovePostFromIndexInputDto } from './remove-post-from-index.input-dto';
import PostRemovedFromIndexEvent from '../../../domain/search-entry/event/post-removed-from-index.event';

export default class RemovePostFromIndexUseCase {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: RemovePostFromIndexInputDto): Promise<void> {
    await this.searchEntryRepository.remove(new PostId(input.postId));

    const removedAt = new Date().toISOString();

    this.logger.info('Post removed from index', { postId: input.postId });

    await this.eventDispatcher.dispatch(
      new PostRemovedFromIndexEvent({ postId: input.postId, removedAt }),
    );
  }
}
