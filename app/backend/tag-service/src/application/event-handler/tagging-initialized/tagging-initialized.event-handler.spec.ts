import type { Logger } from '@drift/shared';
import TaggingInitializedEventHandler, {
  type TaggingInitializedMessage,
} from './tagging-initialized.event-handler';
import type ExecuteTaggingUseCase from '../../usecase/execute-tagging/execute-tagging.use-case';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (
  overrides: Partial<TaggingInitializedMessage> = {},
): TaggingInitializedMessage => ({
  eventName: 'TaggingInitialized',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    taggingProcessId: '019682a0-1234-7000-8000-abcdef012345',
    postId: '019682a0-1234-7000-8000-abcdef012346',
    retryCount: 0,
    initializedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('TaggingInitializedEventHandler', () => {
  let handler: TaggingInitializedEventHandler;
  let executeTaggingUseCase: ExecuteTaggingUseCase;

  beforeEach(() => {
    executeTaggingUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as ExecuteTaggingUseCase;

    handler = new TaggingInitializedEventHandler(executeTaggingUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(executeTaggingUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith({
      taggingProcessId: '019682a0-1234-7000-8000-abcdef012345',
    });
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(executeTaggingUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            taggingProcessId: 'not-a-uuid',
            postId: '019682a0-1234-7000-8000-abcdef012346',
            retryCount: 0,
            initializedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
