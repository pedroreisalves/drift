import type { TaggingInitializedEventPayload } from '../../../domain/tagging-process/event/tagging-initialized.event';
import { type EventHandler } from '@drift/shared';
import ExecuteTaggingCommand from '../../command/execute-tagging/execute-tagging.command';
import type ExecuteTaggingHandler from '../../command/execute-tagging/execute-tagging.handler';
import { type Logger } from '@drift/shared';

export interface TaggingInitializedMessage {
  eventName: string;
  occurredAt: string;
  payload: TaggingInitializedEventPayload;
}

export default class TaggingInitializedEventHandler implements EventHandler<TaggingInitializedMessage> {
  constructor(
    private readonly executeTaggingHandler: ExecuteTaggingHandler,
    private readonly logger: Logger,
  ) {}

  async handle(event: TaggingInitializedMessage): Promise<void> {
    const { taggingProcessId, postId } = event.payload;

    this.logger.info('Received tagging initialized event, scheduling execution', {
      taggingProcessId,
      postId,
    });

    const command = new ExecuteTaggingCommand(taggingProcessId);
    await this.executeTaggingHandler.execute(command);
  }
}
