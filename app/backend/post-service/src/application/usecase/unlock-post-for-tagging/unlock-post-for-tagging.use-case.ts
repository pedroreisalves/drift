import type { UnlockPostForTaggingInputDto } from './unlock-post-for-tagging.input-dto';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import { type Logger } from '@drift/shared';

export default class UnlockPostForTaggingUseCase {
  constructor(
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: UnlockPostForTaggingInputDto): Promise<void> {
    await this.postLockRepository.unlock(input.postId, 'tagging');
    this.logger.info('Post unlocked after tagging', { postId: input.postId });
  }
}
