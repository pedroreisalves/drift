import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Logger } from '@drift/shared';
import PostTaggedEventHandler, { type PostTaggedMessage } from './post-tagged.event-handler';
import type UpdatePostTagsUseCase from '../../usecase/update-post-tags/update-post-tags.use-case';
import type UnlockPostForTaggingUseCase from '../../usecase/unlock-post-for-tagging/unlock-post-for-tagging.use-case';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<PostTaggedMessage> = {}): PostTaggedMessage => ({
  eventName: 'PostTagged',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    taggingProcessId: '019682a0-1234-7000-8000-abcdef012345',
    postId: '019682a0-1234-7000-8000-abcdef012346',
    tags: ['tech', 'news'],
    taggedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('PostTaggedEventHandler', () => {
  let handler: PostTaggedEventHandler;
  let updatePostTagsUseCase: UpdatePostTagsUseCase;
  let unlockPostForTaggingUseCase: UnlockPostForTaggingUseCase;

  beforeEach(() => {
    updatePostTagsUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UpdatePostTagsUseCase;

    unlockPostForTaggingUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UnlockPostForTaggingUseCase;

    handler = new PostTaggedEventHandler(
      updatePostTagsUseCase,
      unlockPostForTaggingUseCase,
      makeLogger(),
    );
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(updatePostTagsUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: '019682a0-1234-7000-8000-abcdef012346',
        tags: ['tech', 'news'],
      }),
    );
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(updatePostTagsUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            taggingProcessId: '019682a0-1234-7000-8000-abcdef012345',
            postId: 'not-a-uuid',
            tags: ['tech', 'news'],
            taggedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should unlock the post and drop the event when the post no longer exists', async () => {
    const updateSpy = vi.spyOn(updatePostTagsUseCase, 'execute').mockRejectedValue(
      new PostNotFoundError('019682a0-1234-7000-8000-abcdef012346'),
    );
    const unlockSpy = vi.spyOn(unlockPostForTaggingUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(unlockSpy).toHaveBeenCalledTimes(1);
    expect(unlockSpy.mock.calls[0][0]).toMatchObject({ postId: '019682a0-1234-7000-8000-abcdef012346' });
  });

  it('should rethrow unexpected errors without unlocking', async () => {
    const unexpectedError = new Error('db connection lost');
    vi.spyOn(updatePostTagsUseCase, 'execute').mockRejectedValue(unexpectedError);
    const unlockSpy = vi.spyOn(unlockPostForTaggingUseCase, 'execute');

    await expect(handler.handle(makeValidMessage())).rejects.toThrow(unexpectedError);

    expect(unlockSpy).not.toHaveBeenCalled();
  });
});
