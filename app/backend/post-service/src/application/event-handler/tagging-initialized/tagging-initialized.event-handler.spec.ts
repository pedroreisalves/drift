import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Logger } from '@drift/shared';
import TaggingInitializedEventHandler, {
  type TaggingInitializedMessage,
} from './tagging-initialized.event-handler';
import type LockPostForTaggingHandler from '../../command/lock-post-for-tagging/lock-post-for-tagging.handler';
import LockPostForTaggingCommand from '../../command/lock-post-for-tagging/lock-post-for-tagging.command';

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
  let lockPostForTaggingHandler: LockPostForTaggingHandler;

  beforeEach(() => {
    lockPostForTaggingHandler = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as LockPostForTaggingHandler;

    handler = new TaggingInitializedEventHandler(lockPostForTaggingHandler, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(lockPostForTaggingHandler, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: '019682a0-1234-7000-8000-abcdef012346',
      }),
    );
    expect(executeSpy.mock.calls[0][0]).toBeInstanceOf(LockPostForTaggingCommand);
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(lockPostForTaggingHandler, 'execute');

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
