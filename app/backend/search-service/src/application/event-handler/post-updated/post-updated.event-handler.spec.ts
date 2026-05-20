import PostUpdatedEventHandler, {
  postUpdatedMessageSchema,
  type PostUpdatedMessage,
} from './post-updated.event-handler';
import type UpdatePostIndexUseCase from '../../usecase/update-post-index/update-post-index.use-case';
import { type Logger } from '@drift/shared';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

describe('PostUpdatedEventHandler', () => {
  const makeUpdatePostIndexUseCase = (): UpdatePostIndexUseCase =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as UpdatePostIndexUseCase;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeValidMessage = (overrides: Partial<PostUpdatedMessage> = {}): PostUpdatedMessage => {
    const base: PostUpdatedMessage = {
      eventName: 'PostUpdated',
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: {
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
        clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
        title: 'Updated Title',
        body: 'Updated body content.',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    };
    return { ...base, ...overrides };
  };

  it('should invoke UpdatePostIndexUseCase.execute with input built from the message payload', async () => {
    const updatePostIndexUseCase = makeUpdatePostIndexUseCase();
    const eventHandler = new PostUpdatedEventHandler(updatePostIndexUseCase, makeLogger());
    const executeSpy = vi.spyOn(updatePostIndexUseCase, 'execute');

    const message = makeValidMessage({
      payload: {
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3e',
        clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3f',
        title: 'My Updated Title',
        body: 'My updated body content.',
        updatedAt: '2026-06-15T10:30:00.000Z',
      },
    });

    await eventHandler.handle(message);

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const input = executeSpy.mock.calls[0][0];
    expect(input.postId).toBe(message.payload.postId);
    expect(input.title).toBe(message.payload.title);
    expect(input.body).toBe(message.payload.body);
  });

  it('should reject and not call execute when the message is invalid', async () => {
    const updatePostIndexUseCase = makeUpdatePostIndexUseCase();
    const eventHandler = new PostUpdatedEventHandler(updatePostIndexUseCase, makeLogger());
    const executeSpy = vi.spyOn(updatePostIndexUseCase, 'execute');

    const invalid = makeValidMessage({
      payload: {
        ...makeValidMessage().payload,
        postId: 'not-a-uuid',
      },
    });

    await expect(eventHandler.handle(invalid)).rejects.toThrow();
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should drop the event and not rethrow when the entry no longer exists', async () => {
    const updatePostIndexUseCase = makeUpdatePostIndexUseCase();
    vi.spyOn(updatePostIndexUseCase, 'execute').mockRejectedValue(
      new DocumentNotFoundError('01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c'),
    );
    const eventHandler = new PostUpdatedEventHandler(updatePostIndexUseCase, makeLogger());

    await expect(eventHandler.handle(makeValidMessage())).resolves.toBeUndefined();
  });

  it('should rethrow when the use case throws a non-DocumentNotFoundError', async () => {
    const updatePostIndexUseCase = makeUpdatePostIndexUseCase();
    vi.spyOn(updatePostIndexUseCase, 'execute').mockRejectedValue(
      new Error('unexpected infrastructure error'),
    );
    const eventHandler = new PostUpdatedEventHandler(updatePostIndexUseCase, makeLogger());

    await expect(eventHandler.handle(makeValidMessage())).rejects.toThrow(
      'unexpected infrastructure error',
    );
  });

  it('should export a valid schema', () => {
    expect(postUpdatedMessageSchema).toBeDefined();
  });
});
