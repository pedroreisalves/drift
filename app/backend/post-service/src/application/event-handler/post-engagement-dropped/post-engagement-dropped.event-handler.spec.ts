import type { Logger } from '@drift/shared';
import PostEngagementDroppedEventHandler, {
  type PostEngagementDroppedMessage,
} from './post-engagement-dropped.event-handler';
import type FlagPostEngagementDropUseCase from '../../usecase/flag-post-engagement-drop/flag-post-engagement-drop.use-case';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (
  overrides: Partial<PostEngagementDroppedMessage> = {},
): PostEngagementDroppedMessage => ({
  eventName: 'PostEngagementDropped',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    postId: '019682a0-1234-7000-8000-abcdef012345',
    viewCount: 2,
    windowHours: 24,
    droppedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('PostEngagementDroppedEventHandler', () => {
  let handler: PostEngagementDroppedEventHandler;
  let flagPostEngagementDropUseCase: FlagPostEngagementDropUseCase;

  beforeEach(() => {
    flagPostEngagementDropUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as FlagPostEngagementDropUseCase;

    handler = new PostEngagementDroppedEventHandler(flagPostEngagementDropUseCase, makeLogger());
  });

  it('should call FlagPostEngagementDropUseCase with the post id when message is valid', async () => {
    const executeSpy = vi.spyOn(flagPostEngagementDropUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith({
      postId: '019682a0-1234-7000-8000-abcdef012345',
    });
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(flagPostEngagementDropUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: 'not-a-uuid',
            viewCount: 2,
            windowHours: 24,
            droppedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should drop the event when the post no longer exists', async () => {
    vi.spyOn(flagPostEngagementDropUseCase, 'execute').mockRejectedValue(
      new PostNotFoundError('019682a0-1234-7000-8000-abcdef012345'),
    );

    await expect(handler.handle(makeValidMessage())).resolves.toBeUndefined();
  });

  it('should rethrow unexpected errors', async () => {
    const unexpectedError = new Error('db connection lost');
    vi.spyOn(flagPostEngagementDropUseCase, 'execute').mockRejectedValue(unexpectedError);

    await expect(handler.handle(makeValidMessage())).rejects.toThrow(unexpectedError);
  });
});
