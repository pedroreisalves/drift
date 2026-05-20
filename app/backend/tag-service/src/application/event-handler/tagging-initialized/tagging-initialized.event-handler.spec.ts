import { uuidv7 } from 'uuidv7';
import TaggingInitializedEventHandler, {
  type TaggingInitializedMessage,
} from './tagging-initialized.event-handler';
import type ExecuteTaggingUseCase from '../../usecase/execute-tagging/execute-tagging.use-case';
import { type Logger } from '@drift/shared';

describe('TaggingInitializedEventHandler', () => {
  const makeExecuteTaggingUseCase = (): ExecuteTaggingUseCase =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as ExecuteTaggingUseCase;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeMessage = (taggingProcessId = uuidv7()): TaggingInitializedMessage => ({
    eventName: 'TaggingInitialized',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      taggingProcessId,
      postId: uuidv7(),
      retryCount: 0,
      initializedAt: '2026-01-01T00:00:00.000Z',
    },
  });

  it('should invoke ExecuteTaggingUseCase.execute with input built from the message payload', async () => {
    const executeTaggingUseCase = makeExecuteTaggingUseCase();
    const eventHandler = new TaggingInitializedEventHandler(executeTaggingUseCase, makeLogger());

    const taggingProcessId = uuidv7();
    const executeSpy = vi.spyOn(executeTaggingUseCase, 'execute');

    await eventHandler.handle(makeMessage(taggingProcessId));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).toHaveBeenCalledWith({ taggingProcessId });
  });
});
