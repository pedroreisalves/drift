import type { TaggingFailedEventPayload } from '../../../domain/tagging-process/event/tagging-failed.event';
import { type EventHandler } from '@drift/shared';
import ExecuteTaggingCommand from '../../command/execute-tagging/execute-tagging.command';
import type ExecuteTaggingHandler from '../../command/execute-tagging/execute-tagging.handler';
import { type Logger } from '@drift/shared';

export interface TaggingFailedMessage {
  eventName: string;
  occurredAt: string;
  payload: TaggingFailedEventPayload;
}

export default class TaggingFailedEventHandler implements EventHandler<TaggingFailedMessage> {
  constructor(
    private readonly executeTaggingHandler: ExecuteTaggingHandler,
    private readonly logger: Logger,
  ) {}

  async handle(event: TaggingFailedMessage): Promise<void> {
    const { taggingProcessId, postId, retryCount, reason } = event.payload;

    this.logger.info('Received tagging failed event, scheduling retry', {
      taggingProcessId,
      postId,
      retryCount,
      reason,
    });

    const command = new ExecuteTaggingCommand(taggingProcessId);
    await this.executeTaggingHandler.execute(command);
  }
}
