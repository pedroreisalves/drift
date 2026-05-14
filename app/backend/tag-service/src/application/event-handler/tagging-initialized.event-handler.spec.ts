import { uuidv7 } from 'uuidv7';
import TaggingInitializedEventHandler, {
  type TaggingInitializedMessage,
} from './tagging-initialized.event-handler';
import ExecuteTaggingCommand from '../command/execute-tagging/execute-tagging.command';
import type ExecuteTaggingHandler from '../command/execute-tagging/execute-tagging.handler';
import { type Logger } from '@drift/shared';

describe('TaggingInitializedEventHandler', () => {
  const makeExecuteTaggingHandler = (): ExecuteTaggingHandler =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as ExecuteTaggingHandler;

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

  it('should invoke ExecuteTaggingHandler.execute with a command built from the message payload', async () => {
    const executeTaggingHandler = makeExecuteTaggingHandler();
    const eventHandler = new TaggingInitializedEventHandler(executeTaggingHandler, makeLogger());

    const taggingProcessId = uuidv7();
    const executeSpy = vi.spyOn(executeTaggingHandler, 'execute');

    await eventHandler.handle(makeMessage(taggingProcessId));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(ExecuteTaggingCommand);
    expect(command.taggingProcessId).toBe(taggingProcessId);
  });
});
