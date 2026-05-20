import { uuidv7 } from 'uuidv7';
import PostDeletedEventHandler, { type PostDeletedMessage } from './post-deleted.event-handler';
import type RemovePostFromIndexUseCase from '../../usecase/remove-post-from-index/remove-post-from-index.use-case';
import { type Logger } from '@drift/shared';

describe('PostDeletedEventHandler', () => {
  const makeRemovePostFromIndexUseCase = (): RemovePostFromIndexUseCase =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as RemovePostFromIndexUseCase;

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

  it('should invoke RemovePostFromIndexUseCase.execute with input built from the message payload', async () => {
    const removePostFromIndexUseCase = makeRemovePostFromIndexUseCase();
    const eventHandler = new PostDeletedEventHandler(removePostFromIndexUseCase, makeLogger());

    const postId = uuidv7();
    const executeSpy = vi.spyOn(removePostFromIndexUseCase, 'execute');

    await eventHandler.handle(makeMessage({ postId }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const input = executeSpy.mock.calls[0][0];
    expect(input.postId).toBe(postId);
  });
});
