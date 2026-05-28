import { PostId, type Logger, type UseCase } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import type { UpdateSearchEntryFeaturedStatusInputDto } from './update-search-entry-featured-status.dto';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';

export default class UpdateSearchEntryFeaturedStatusUseCase implements UseCase<
  UpdateSearchEntryFeaturedStatusInputDto,
  void
> {
  constructor(
    private readonly searchEntryRepository: SearchEntryRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: UpdateSearchEntryFeaturedStatusInputDto): Promise<void> {
    const postId = new PostId(input.postId);
    const entry = await this.searchEntryRepository.findByPostId(postId);

    if (!entry) {
      this.logger.error('Search entry not found', { postId: input.postId });
      throw new DocumentNotFoundError(input.postId);
    }

    entry.setFeatured(input.isFeatured);

    try {
      await this.searchEntryRepository.update(entry);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new IndexingFailedError(reason);
    }

    this.logger.info('Search entry featured status updated', {
      postId: input.postId,
      isFeatured: input.isFeatured,
    });
  }
}
