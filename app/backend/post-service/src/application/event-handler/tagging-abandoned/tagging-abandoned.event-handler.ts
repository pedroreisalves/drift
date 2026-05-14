import { type EventHandler } from '@drift/shared';
import { type Logger } from '@drift/shared';
import UnlockPostForTaggingCommand from '../../command/unlock-post-for-tagging/unlock-post-for-tagging.command';
import type UnlockPostForTaggingHandler from '../../command/unlock-post-for-tagging/unlock-post-for-tagging.handler';

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
    private readonly unlockPostForTaggingHandler: UnlockPostForTaggingHandler,
    private readonly logger: Logger,
  ) {}

  async handle(event: TaggingAbandonedMessage): Promise<void> {
    const { postId } = event.payload;

    await this.unlockPostForTaggingHandler.execute(new UnlockPostForTaggingCommand(postId));

    this.logger.info('TaggingAbandoned handled', { postId });
  }
}
