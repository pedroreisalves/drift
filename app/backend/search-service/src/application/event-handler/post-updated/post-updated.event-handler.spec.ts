import type { Logger } from '@drift/shared';
import PostUpdatedEventHandler, { type PostUpdatedMessage } from './post-updated.event-handler';
import type UpdatePostIndexUseCase from '../../usecase/update-post-index/update-post-index.use-case';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<PostUpdatedMessage> = {}): PostUpdatedMessage => ({
  eventName: 'PostUpdated',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
    clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
    title: 'Updated Title',
    body: 'Updated body content.',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('PostUpdatedEventHandler', () => {
  let handler: PostUpdatedEventHandler;
  let updatePostIndexUseCase: UpdatePostIndexUseCase;

  beforeEach(() => {
    updatePostIndexUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UpdatePostIndexUseCase;

    handler = new PostUpdatedEventHandler(updatePostIndexUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(updatePostIndexUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
        title: 'Updated Title',
        body: 'Updated body content.',
      }),
    );
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(updatePostIndexUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: 'not-a-uuid',
            clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
            title: 'Updated Title',
            body: 'Updated body content.',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should drop the event when the document no longer exists', async () => {
    vi.spyOn(updatePostIndexUseCase, 'execute').mockRejectedValue(
      new DocumentNotFoundError('01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c'),
    );

    await expect(handler.handle(makeValidMessage())).resolves.toBeUndefined();
  });

  it('should rethrow unexpected errors', async () => {
    const unexpectedError = new Error('unexpected infrastructure error');
    vi.spyOn(updatePostIndexUseCase, 'execute').mockRejectedValue(unexpectedError);

    await expect(handler.handle(makeValidMessage())).rejects.toThrow(unexpectedError);
  });
});
