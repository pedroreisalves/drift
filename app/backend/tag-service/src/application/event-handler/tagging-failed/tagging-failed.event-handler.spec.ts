import { uuidv7 } from 'uuidv7';
import TaggingFailedEventHandler, {
  type TaggingFailedMessage,
} from './tagging-failed.event-handler';
import type ExecuteTaggingUseCase from '../../usecase/execute-tagging/execute-tagging.use-case';
import { type Logger } from '@drift/shared';

describe('TaggingFailedEventHandler', () => {
  const makeExecuteTaggingUseCase = (): ExecuteTaggingUseCase =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as ExecuteTaggingUseCase;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeMessage = (taggingProcessId = uuidv7()): TaggingFailedMessage => ({
    eventName: 'TaggingFailed',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      taggingProcessId,
      postId: uuidv7(),
      retryCount: 1,
      reason: 'AI service unavailable',
      failedAt: '2026-01-01T00:00:00.000Z',
    },
  });

  it('should invoke ExecuteTaggingUseCase.execute with input built from the message payload', async () => {
    const executeTaggingUseCase = makeExecuteTaggingUseCase();
    const eventHandler = new TaggingFailedEventHandler(executeTaggingUseCase, makeLogger());

    const taggingProcessId = uuidv7();
    const executeSpy = vi.spyOn(executeTaggingUseCase, 'execute');

    await eventHandler.handle(makeMessage(taggingProcessId));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).toHaveBeenCalledWith({ taggingProcessId });
  });
});
