import { PostId, type EventDispatcher, type Logger, type UseCase } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import type { UpdatePostIndexInputDto } from './update-post-index.dto';
import PostIndexedEvent from '../../../domain/search-entry/event/post-indexed.event';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';

export default class UpdatePostIndexUseCase implements UseCase<UpdatePostIndexInputDto, void> {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: UpdatePostIndexInputDto): Promise<void> {
    const postId = new PostId(input.postId);
    const entry = await this.searchEntryRepository.findByPostId(postId);

    if (!entry) {
      throw new DocumentNotFoundError(input.postId);
    }

    entry.updateContent({ title: input.title, body: input.body });

    try {
      await this.searchEntryRepository.update(entry);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new IndexingFailedError(reason);
    }

    const indexedAt = new Date().toISOString();

    this.logger.info('Post index updated', { postId: input.postId });

    await this.eventDispatcher.dispatch(new PostIndexedEvent({ postId: input.postId, indexedAt }));
  }
}
