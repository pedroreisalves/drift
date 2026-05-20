import { uuidv7 } from 'uuidv7';
import PostUpdatedEventHandler, { type PostUpdatedMessage } from './post-updated.event-handler';
import UpdatePostIndexCommand from '../../command/update-post-index/update-post-index.command';
import type UpdatePostIndexHandler from '../../command/update-post-index/update-post-index.handler';
import { type Logger } from '@drift/shared';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

describe('PostUpdatedEventHandler', () => {
  const makeUpdatePostIndexHandler = (): UpdatePostIndexHandler =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as UpdatePostIndexHandler;

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
    const updatePostIndexHandler = makeUpdatePostIndexHandler();
    (updatePostIndexHandler.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new DocumentNotFoundError(uuidv7()),
    );
    const eventHandler = new PostUpdatedEventHandler(updatePostIndexHandler, makeLogger());

    await expect(eventHandler.handle(makeMessage())).resolves.toBeUndefined();
  });

  it('should rethrow when the command handler throws a non-DocumentNotFoundError', async () => {
    const updatePostIndexHandler = makeUpdatePostIndexHandler();
    (updatePostIndexHandler.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('unexpected infrastructure error'),
    );
    const eventHandler = new PostUpdatedEventHandler(updatePostIndexHandler, makeLogger());

    await expect(eventHandler.handle(makeMessage())).rejects.toThrow(
      'unexpected infrastructure error',
    );
  });

  it('should invoke UpdatePostIndexHandler.execute with a command built from the message payload', async () => {
    const updatePostIndexHandler = makeUpdatePostIndexHandler();
    const eventHandler = new PostUpdatedEventHandler(updatePostIndexHandler, makeLogger());

    const postId = uuidv7();
    const title = 'My Updated Title';
    const body = 'My updated body content.';

    const executeSpy = vi.spyOn(updatePostIndexHandler, 'execute');

    await eventHandler.handle(makeMessage({ postId, title, body }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(UpdatePostIndexCommand);
    expect(command.postId).toBe(postId);
    expect(command.title).toBe(title);
    expect(command.body).toBe(body);
  });
});
