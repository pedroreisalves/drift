import { type Logger, PostId, type UseCase } from '@drift/shared';

import type PostLockRepository from '../../../domain/post/repository/post-lock.repository';
import { POST_LOCK_TYPE } from '../../../domain/post/repository/post-lock.repository';
import type { LockPostForTaggingInputDto } from './lock-post-for-tagging.dto';

export default class LockPostForTaggingUseCase implements UseCase<
  LockPostForTaggingInputDto,
  void
> {
  constructor(
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: LockPostForTaggingInputDto): Promise<void> {
    const postId = new PostId(input.postId);
    await this.postLockRepository.lock(postId, POST_LOCK_TYPE.TAGGING);
    this.logger.info('Post locked for tagging', { postId: postId.toString() });
  }
}
