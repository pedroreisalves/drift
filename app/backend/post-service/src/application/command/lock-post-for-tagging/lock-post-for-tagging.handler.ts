import type LockPostForTaggingCommand from './lock-post-for-tagging.command';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import { type Logger } from '@drift/shared';

export default class LockPostForTaggingHandler {
  constructor(
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async execute(command: LockPostForTaggingCommand): Promise<void> {
    await this.postLockRepository.lock(command.postId, 'tagging');
    this.logger.info('Post locked for tagging', { postId: command.postId });
  }
}
