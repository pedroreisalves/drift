import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Logger } from '@drift/shared';
import TaggingAbandonedEventHandler, {
  type TaggingAbandonedMessage,
} from './tagging-abandoned.event-handler';
import type UnlockPostForTaggingHandler from '../../command/unlock-post-for-tagging/unlock-post-for-tagging.handler';
import UnlockPostForTaggingCommand from '../../command/unlock-post-for-tagging/unlock-post-for-tagging.command';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<TaggingAbandonedMessage> = {}): TaggingAbandonedMessage => ({
  eventName: 'TaggingAbandoned',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    taggingProcessId: '019682a0-1234-7000-8000-abcdef012345',
    postId: '019682a0-1234-7000-8000-abcdef012346',
    retryCount: 3,
    reason: 'LLM timeout after 3 retries',
    abandonedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('TaggingAbandonedEventHandler', () => {
  let handler: TaggingAbandonedEventHandler;
  let unlockPostForTaggingHandler: UnlockPostForTaggingHandler;

  beforeEach(() => {
    unlockPostForTaggingHandler = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UnlockPostForTaggingHandler;

    handler = new TaggingAbandonedEventHandler(unlockPostForTaggingHandler, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(unlockPostForTaggingHandler, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: '019682a0-1234-7000-8000-abcdef012346',
      }),
    );
    expect(executeSpy.mock.calls[0][0]).toBeInstanceOf(UnlockPostForTaggingCommand);
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(unlockPostForTaggingHandler, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            taggingProcessId: '019682a0-1234-7000-8000-abcdef012345',
            postId: 'not-a-uuid',
            retryCount: 3,
            reason: 'LLM timeout after 3 retries',
            abandonedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
