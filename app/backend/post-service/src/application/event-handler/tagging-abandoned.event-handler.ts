import type EventHandler from '../@shared/interface/event-handler.interface';
import type PostLockRepository from '../@shared/interface/post-lock.repository';
import type Logger from '../@shared/interface/logger.interface';

export interface TaggingAbandonedMessage {
  eventName: string;
  occurredAt: string;
  payload: {
    taggingProcessId: string;
    postId: string;
    reason: string;
    retryCount: number;
    abandonedAt: string;
  };
}

export default class TaggingAbandonedEventHandler implements EventHandler<TaggingAbandonedMessage> {
  constructor(
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async handle(event: TaggingAbandonedMessage): Promise<void> {
    const { postId } = event.payload;

    await this.postLockRepository.unlock(postId, 'tagging');

    this.logger.info('Post unlocked after tagging abandoned', { postId });
  }
}
