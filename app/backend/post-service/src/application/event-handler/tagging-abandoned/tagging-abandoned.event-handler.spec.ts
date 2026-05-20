import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Logger } from '@drift/shared';
import TaggingAbandonedEventHandler, {
  type TaggingAbandonedMessage,
} from './tagging-abandoned.event-handler';
import type UnlockPostForTaggingUseCase from '../../usecase/unlock-post-for-tagging/unlock-post-for-tagging.use-case';

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
  let unlockPostForTaggingUseCase: UnlockPostForTaggingUseCase;

  beforeEach(() => {
    unlockPostForTaggingUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UnlockPostForTaggingUseCase;

    handler = new TaggingAbandonedEventHandler(unlockPostForTaggingUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(unlockPostForTaggingUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: '019682a0-1234-7000-8000-abcdef012346',
      }),
    );
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(unlockPostForTaggingUseCase, 'execute');

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
