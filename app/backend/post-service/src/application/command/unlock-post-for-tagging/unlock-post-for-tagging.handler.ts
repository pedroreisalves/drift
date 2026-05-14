import type UnlockPostForTaggingCommand from './unlock-post-for-tagging.command';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import { type Logger } from '@drift/shared';

export default class UnlockPostForTaggingHandler {
  constructor(
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async execute(command: UnlockPostForTaggingCommand): Promise<void> {
    await this.postLockRepository.unlock(command.postId, 'tagging');
    this.logger.info('Post unlocked after tagging', { postId: command.postId });
  }
}
