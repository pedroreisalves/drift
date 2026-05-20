import type { TaggingFailedEventPayload } from '../../../domain/tagging-process/event/tagging-failed.event';
import { type EventHandler } from '@drift/shared';
import type ExecuteTaggingUseCase from '../../usecase/execute-tagging/execute-tagging.use-case';
import { type Logger } from '@drift/shared';

export interface TaggingFailedMessage {
  eventName: string;
  occurredAt: string;
  payload: TaggingFailedEventPayload;
}

export default class TaggingFailedEventHandler implements EventHandler<TaggingFailedMessage> {
  constructor(
    private readonly executeTaggingUseCase: ExecuteTaggingUseCase,
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

    await this.executeTaggingUseCase.execute({ taggingProcessId });
  }
}
