import PostDeletedEventHandler, {
  postDeletedMessageSchema,
  type PostDeletedMessage,
} from './post-deleted.event-handler';
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

  const makeValidMessage = (overrides: Partial<PostDeletedMessage> = {}): PostDeletedMessage => {
    const base: PostDeletedMessage = {
      eventName: 'PostDeleted',
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: {
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
        clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
        deletedAt: '2026-01-01T00:00:00.000Z',
      },
    };
    return { ...base, ...overrides };
  };

  it('should invoke RemovePostFromIndexUseCase.execute with input built from the message payload', async () => {
    const removePostFromIndexUseCase = makeRemovePostFromIndexUseCase();
    const eventHandler = new PostDeletedEventHandler(removePostFromIndexUseCase, makeLogger());
    const executeSpy = vi.spyOn(removePostFromIndexUseCase, 'execute');

    const message = makeValidMessage({
      payload: {
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3e',
        clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3f',
        deletedAt: '2026-06-15T10:30:00.000Z',
      },
    });

    await eventHandler.handle(message);

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const input = executeSpy.mock.calls[0][0];
    expect(input.postId).toBe(message.payload.postId);
  });

  it('should reject and not call execute when the message is invalid', async () => {
    const removePostFromIndexUseCase = makeRemovePostFromIndexUseCase();
    const eventHandler = new PostDeletedEventHandler(removePostFromIndexUseCase, makeLogger());
    const executeSpy = vi.spyOn(removePostFromIndexUseCase, 'execute');

    const invalid = makeValidMessage({
      payload: {
        ...makeValidMessage().payload,
        postId: 'not-a-uuid',
      },
    });

    await expect(eventHandler.handle(invalid)).rejects.toThrow();
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should export a valid schema', () => {
    expect(postDeletedMessageSchema).toBeDefined();
  });
});
