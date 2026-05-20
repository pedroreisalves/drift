import type { TaggingInitializedEventPayload } from '../../../domain/tagging-process/event/tagging-initialized.event';
import { type EventHandler } from '@drift/shared';
import type ExecuteTaggingUseCase from '../../usecase/execute-tagging/execute-tagging.use-case';
import { type Logger } from '@drift/shared';

export interface TaggingInitializedMessage {
  eventName: string;
  occurredAt: string;
  payload: TaggingInitializedEventPayload;
}

export default class TaggingInitializedEventHandler implements EventHandler<TaggingInitializedMessage> {
  constructor(
    private readonly executeTaggingUseCase: ExecuteTaggingUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(event: TaggingInitializedMessage): Promise<void> {
    const { taggingProcessId, postId } = event.payload;

    this.logger.info('Received tagging initialized event, scheduling execution', {
      taggingProcessId,
      postId,
    });

    await this.executeTaggingUseCase.execute({ taggingProcessId });
  }
}
