import type { UnlockPostForTaggingInputDto } from './unlock-post-for-tagging.dto';
import type PostLockRepository from '../../../domain/post/repository/post-lock.repository';
import { POST_LOCK_TYPE } from '../../@shared/constant/post-lock.constant';
import { PostId, type Logger, type UseCase } from '@drift/shared';

export default class UnlockPostForTaggingUseCase implements UseCase<
  UnlockPostForTaggingInputDto,
  void
> {
  constructor(
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: UnlockPostForTaggingInputDto): Promise<void> {
    const postId = new PostId(input.postId);
    await this.postLockRepository.unlock(postId.toString(), POST_LOCK_TYPE.TAGGING);
    this.logger.info('Post unlocked after tagging', { postId: postId.toString() });
  }
}
