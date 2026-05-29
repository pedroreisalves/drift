import type { Logger } from '@drift/shared';

import type RemovePostFromIndexUseCase from '../../usecase/remove-post-from-index/remove-post-from-index.use-case';
import PostDeletedEventHandler, { type PostDeletedMessage } from './post-deleted.event-handler';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<PostDeletedMessage> = {}): PostDeletedMessage => ({
  eventName: 'PostDeleted',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
    clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
    deletedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('PostDeletedEventHandler', () => {
  let handler: PostDeletedEventHandler;
  let removePostFromIndexUseCase: RemovePostFromIndexUseCase;

  beforeEach(() => {
    removePostFromIndexUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as RemovePostFromIndexUseCase;

    handler = new PostDeletedEventHandler(removePostFromIndexUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(removePostFromIndexUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
      }),
    );
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(removePostFromIndexUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: 'not-a-uuid',
            clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
            deletedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
