import { PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type { RemovePostFromIndexInputDto } from './remove-post-from-index.input-dto';
import PostRemovedFromIndexEvent from '../../../domain/search-entry/event/post-removed-from-index.event';
import RemovalFailedError from '../../@shared/error/removal-failed.error';

export default class RemovePostFromIndexUseCase {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: RemovePostFromIndexInputDto): Promise<void> {
    const postId = new PostId(input.postId);

    const entry = await this.searchEntryRepository.findByPostId(postId);

    if (!entry) {
      this.logger.warn('Post not found in index, skipping removal', { postId: input.postId });
      return;
    }

    try {
      await this.searchEntryRepository.remove(postId);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new RemovalFailedError(reason);
    }

    const removedAt = new Date().toISOString();

    this.logger.info('Post removed from index', { postId: input.postId });

    await this.eventDispatcher.dispatch(
      new PostRemovedFromIndexEvent({ postId: input.postId, removedAt }),
    );
  }
}
