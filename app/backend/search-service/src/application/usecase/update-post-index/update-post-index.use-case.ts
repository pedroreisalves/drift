import { PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type { UpdatePostIndexInputDto } from './update-post-index.input-dto';
import PostIndexedEvent from '../../../domain/search-entry/event/post-indexed.event';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

export default class UpdatePostIndexUseCase {
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

    await this.searchEntryRepository.update(entry);

    const indexedAt = new Date().toISOString();

    this.logger.info('Post index updated', { postId: input.postId });

    await this.eventDispatcher.dispatch(new PostIndexedEvent({ postId: input.postId, indexedAt }));
  }
}
