import type { Logger } from '@drift/shared';
import PostDemotedEventHandler, { type PostDemotedMessage } from './post-demoted.event-handler';
import type UpdateSearchEntryFeaturedStatusUseCase from '../../usecase/update-search-entry-featured-status/update-search-entry-featured-status.use-case';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<PostDemotedMessage> = {}): PostDemotedMessage => ({
  eventName: 'PostDemoted',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
    demotedAt: '2026-01-01T00:00:00.000Z',
    reason: 'expiry_and_engagement_drop',
  },
  ...overrides,
});

describe('PostDemotedEventHandler', () => {
  let handler: PostDemotedEventHandler;
  let useCase: UpdateSearchEntryFeaturedStatusUseCase;

  beforeEach(() => {
    useCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UpdateSearchEntryFeaturedStatusUseCase;

    handler = new PostDemotedEventHandler(useCase, makeLogger());
  });

  it('should call use case with isFeatured: false when message is valid', async () => {
    const executeSpy = vi.spyOn(useCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith({
      postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
      isFeatured: false,
    });
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(useCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: 'not-a-uuid',
            demotedAt: '2026-01-01T00:00:00.000Z',
            reason: 'expiry_and_engagement_drop',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should drop the event when the document no longer exists', async () => {
    vi.spyOn(useCase, 'execute').mockRejectedValue(
      new DocumentNotFoundError('01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c'),
    );

    await expect(handler.handle(makeValidMessage())).resolves.toBeUndefined();
  });

  it('should rethrow unexpected errors', async () => {
    const unexpectedError = new Error('Unexpected');
    vi.spyOn(useCase, 'execute').mockRejectedValue(unexpectedError);

    await expect(handler.handle(makeValidMessage())).rejects.toThrow(unexpectedError);
  });
});
