import type { Logger } from '@drift/shared';
import PostCreatedEventHandler, { type PostCreatedMessage } from './post-created.event-handler';
import type IndexPostUseCase from '../../usecase/index-post/index-post.use-case';

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
    clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
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
            clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
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
