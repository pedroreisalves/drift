import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Logger } from '@drift/shared';
import TaggingInitializedEventHandler, {
  type TaggingInitializedMessage,
} from './tagging-initialized.event-handler';
import type LockPostForTaggingUseCase from '../../usecase/lock-post-for-tagging/lock-post-for-tagging.use-case';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<TaggingInitializedMessage> = {}): TaggingInitializedMessage => ({
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
  let lockPostForTaggingUseCase: LockPostForTaggingUseCase;

  beforeEach(() => {
    lockPostForTaggingUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as LockPostForTaggingUseCase;

    handler = new TaggingInitializedEventHandler(lockPostForTaggingUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(lockPostForTaggingUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: '019682a0-1234-7000-8000-abcdef012346',
      }),
    );
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(lockPostForTaggingUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            taggingProcessId: '019682a0-1234-7000-8000-abcdef012345',
            postId: 'not-a-uuid',
            retryCount: 0,
            initializedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
