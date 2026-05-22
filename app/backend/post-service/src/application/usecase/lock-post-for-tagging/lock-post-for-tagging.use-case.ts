import type { LockPostForTaggingInputDto } from './lock-post-for-tagging.input-dto';
import type PostLockRepository from '../../../domain/post/repository/post-lock.repository';
import { POST_LOCK_TYPE } from '../../@shared/constant/post-lock.constant';
import { type Logger } from '@drift/shared';

export default class LockPostForTaggingUseCase {
  constructor(
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: LockPostForTaggingInputDto): Promise<void> {
    await this.postLockRepository.lock(input.postId, POST_LOCK_TYPE.TAGGING);
    this.logger.info('Post locked for tagging', { postId: input.postId });
  }
}
