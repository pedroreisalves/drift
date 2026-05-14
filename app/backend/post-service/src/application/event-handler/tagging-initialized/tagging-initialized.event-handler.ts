import { type EventHandler } from '@drift/shared';
import { type Logger } from '@drift/shared';
import LockPostForTaggingCommand from '../../command/lock-post-for-tagging/lock-post-for-tagging.command';
import type LockPostForTaggingHandler from '../../command/lock-post-for-tagging/lock-post-for-tagging.handler';

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
    private readonly lockPostForTaggingHandler: LockPostForTaggingHandler,
    private readonly logger: Logger,
  ) {}

  async handle(event: TaggingInitializedMessage): Promise<void> {
    const { postId } = event.payload;

    await this.lockPostForTaggingHandler.execute(new LockPostForTaggingCommand(postId));

    this.logger.info('TaggingInitialized handled', { postId });
  }
}
