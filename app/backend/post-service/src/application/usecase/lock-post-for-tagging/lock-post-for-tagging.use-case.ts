import type { LockPostForTaggingInputDto } from './lock-post-for-tagging.input-dto';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import { type Logger } from '@drift/shared';

export default class LockPostForTaggingUseCase {
  constructor(
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: LockPostForTaggingInputDto): Promise<void> {
    await this.postLockRepository.lock(input.postId, 'tagging');
    this.logger.info('Post locked for tagging', { postId: input.postId });
  }
}
