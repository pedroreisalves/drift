import type { Logger } from '@drift/shared';

import type IndexPostUseCase from '../../usecase/index-post/index-post.use-case';
import PostCreatedEventHandler, { type PostCreatedMessage } from './post-created.event-handler';

const VALID_CLIENT_HASH = 'a'.repeat(64);

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<PostCreatedMessage> = {}): PostCreatedMessage => ({
  eventName: 'PostCreated',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
    clientHash: VALID_CLIENT_HASH,
    clientName: 'witty_owl042',
    title: 'My Post Title',
    body: 'Post body content.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('PostCreatedEventHandler', () => {
  let handler: PostCreatedEventHandler;
  let indexPostUseCase: IndexPostUseCase;

  beforeEach(() => {
    indexPostUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as IndexPostUseCase;

    handler = new PostCreatedEventHandler(indexPostUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(indexPostUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
        clientHash: VALID_CLIENT_HASH,
        clientName: 'witty_owl042',
        title: 'My Post Title',
        body: 'Post body content.',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(indexPostUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: 'not-a-uuid',
            clientHash: VALID_CLIENT_HASH,
            clientName: 'witty_owl042',
            title: 'My Post Title',
            body: 'Post body content.',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should throw when clientHash is not a 64-char lowercase hex', async () => {
    const executeSpy = vi.spyOn(indexPostUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
            clientHash: 'not-a-hash',
            clientName: 'witty_owl042',
            title: 'My Post Title',
            body: 'Post body content.',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
