import type { Logger } from '@drift/shared';
import PostEngagementRaisedEventHandler, {
  type PostEngagementRaisedMessage,
} from './post-engagement-raised.event-handler';
import type PromotePostUseCase from '../../usecase/promote-post/promote-post.use-case';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (
  overrides: Partial<PostEngagementRaisedMessage> = {},
): PostEngagementRaisedMessage => ({
  eventName: 'PostEngagementRaised',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    postId: '019682a0-1234-7000-8000-abcdef012345',
    viewCount: 15,
    windowHours: 24,
    raisedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('PostEngagementRaisedEventHandler', () => {
  let handler: PostEngagementRaisedEventHandler;
  let promotePostUseCase: PromotePostUseCase;

  beforeEach(() => {
    promotePostUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as PromotePostUseCase;

    handler = new PostEngagementRaisedEventHandler(promotePostUseCase, makeLogger());
  });

  it('should call PromotePostUseCase with the post id when message is valid', async () => {
    const executeSpy = vi.spyOn(promotePostUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith({
      postId: '019682a0-1234-7000-8000-abcdef012345',
    });
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(promotePostUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: 'not-a-uuid',
            viewCount: 15,
            windowHours: 24,
            raisedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should drop the event when the post no longer exists', async () => {
    vi.spyOn(promotePostUseCase, 'execute').mockRejectedValue(
      new PostNotFoundError('019682a0-1234-7000-8000-abcdef012345'),
    );

    await expect(handler.handle(makeValidMessage())).resolves.toBeUndefined();
  });

  it('should rethrow unexpected errors', async () => {
    const unexpectedError = new Error('db connection lost');
    vi.spyOn(promotePostUseCase, 'execute').mockRejectedValue(unexpectedError);

    await expect(handler.handle(makeValidMessage())).rejects.toThrow(unexpectedError);
  });
});
