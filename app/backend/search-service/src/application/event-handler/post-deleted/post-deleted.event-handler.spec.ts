import { uuidv7 } from 'uuidv7';
import PostDeletedEventHandler, { type PostDeletedMessage } from './post-deleted.event-handler';
import RemovePostFromIndexCommand from '../../command/remove-post-from-index/remove-post-from-index.command';
import type RemovePostFromIndexHandler from '../../command/remove-post-from-index/remove-post-from-index.handler';
import { type Logger } from '@drift/shared';

describe('PostDeletedEventHandler', () => {
  const makeRemovePostFromIndexHandler = (): RemovePostFromIndexHandler =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as RemovePostFromIndexHandler;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeMessage = (
    overrides: Partial<PostDeletedMessage['payload']> = {},
  ): PostDeletedMessage => ({
    eventName: 'PostDeleted',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      postId: overrides.postId ?? uuidv7(),
      clientId: overrides.clientId ?? uuidv7(),
      deletedAt: '2026-01-01T00:00:00.000Z',
    },
  });

  it('should invoke RemovePostFromIndexHandler.execute with a command built from the message payload', async () => {
    const removePostFromIndexHandler = makeRemovePostFromIndexHandler();
    const eventHandler = new PostDeletedEventHandler(removePostFromIndexHandler, makeLogger());

    const postId = uuidv7();
    const executeSpy = vi.spyOn(removePostFromIndexHandler, 'execute');

    await eventHandler.handle(makeMessage({ postId }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(RemovePostFromIndexCommand);
    expect(command.postId).toBe(postId);
  });
});
