import { uuidv7 } from 'uuidv7';
import PostUpdatedEventHandler, { type PostUpdatedMessage } from './post-updated.event-handler';
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

  const makeMessage = (
    overrides: Partial<PostUpdatedMessage['payload']> = {},
  ): PostUpdatedMessage => ({
    eventName: 'PostUpdated',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      postId: overrides.postId ?? uuidv7(),
      clientId: overrides.clientId ?? uuidv7(),
      clientName: overrides.clientName ?? 'John Doe',
      title: overrides.title ?? 'Updated Title',
      body: overrides.body ?? 'Updated body content.',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  });

  it('should drop the event and not rethrow when the entry no longer exists', async () => {
    const updatePostIndexUseCase = makeUpdatePostIndexUseCase();
    (updatePostIndexUseCase.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new DocumentNotFoundError(uuidv7()),
    );
    const eventHandler = new PostUpdatedEventHandler(updatePostIndexUseCase, makeLogger());

    await expect(eventHandler.handle(makeMessage())).resolves.toBeUndefined();
  });

  it('should rethrow when the use case throws a non-DocumentNotFoundError', async () => {
    const updatePostIndexUseCase = makeUpdatePostIndexUseCase();
    (updatePostIndexUseCase.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('unexpected infrastructure error'),
    );
    const eventHandler = new PostUpdatedEventHandler(updatePostIndexUseCase, makeLogger());

    await expect(eventHandler.handle(makeMessage())).rejects.toThrow(
      'unexpected infrastructure error',
    );
  });

  it('should invoke UpdatePostIndexUseCase.execute with input built from the message payload', async () => {
    const updatePostIndexUseCase = makeUpdatePostIndexUseCase();
    const eventHandler = new PostUpdatedEventHandler(updatePostIndexUseCase, makeLogger());

    const postId = uuidv7();
    const title = 'My Updated Title';
    const body = 'My updated body content.';

    const executeSpy = vi.spyOn(updatePostIndexUseCase, 'execute');

    await eventHandler.handle(makeMessage({ postId, title, body }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const input = executeSpy.mock.calls[0][0];
    expect(input.postId).toBe(postId);
    expect(input.title).toBe(title);
    expect(input.body).toBe(body);
  });
});
