import type { UnlockPostForTaggingInputDto } from './unlock-post-for-tagging.input-dto';
import type PostLockRepository from '../../../domain/post/repository/post-lock.repository';
import { POST_LOCK_TYPE } from '../../@shared/constant/post-lock.constant';
import { type Logger } from '@drift/shared';

export default class UnlockPostForTaggingUseCase {
  constructor(
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: UnlockPostForTaggingInputDto): Promise<void> {
    await this.postLockRepository.unlock(input.postId, POST_LOCK_TYPE.TAGGING);
    this.logger.info('Post unlocked after tagging', { postId: input.postId });
  }
}
