import type EventHandler from '../@shared/interface/event-handler.interface';
import type PostLockRepository from '../@shared/interface/post-lock.repository';
import type Logger from '../@shared/interface/logger.interface';

export interface TaggingInitializedMessage {
  eventName: string;
  occurredAt: string;
  payload: {
    taggingProcessId: string;
    postId: string;
    retryCount: number;
    initializedAt: string;
  };
}

export default class TaggingInitializedEventHandler implements EventHandler<TaggingInitializedMessage> {
  constructor(
    private readonly postLockRepository: PostLockRepository,
    private readonly logger: Logger,
  ) {}

  async handle(event: TaggingInitializedMessage): Promise<void> {
    const { postId } = event.payload;

    await this.postLockRepository.lock(postId, 'tagging');

    this.logger.info('Post locked for tagging', { postId });
  }
}
