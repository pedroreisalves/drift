import type { Logger } from '@drift/shared';
import PostChangedEventHandler, { type PostChangedMessage } from './post-changed.event-handler';
import type TagPostUseCase from '../../usecase/tag-post/tag-post.use-case';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<PostChangedMessage> = {}): PostChangedMessage => ({
  eventName: 'PostCreated',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    postId: '019682a0-1234-7000-8000-abcdef012345',
    clientId: '019682a0-1234-7000-8000-abcdef012346',
    clientName: 'Test Client',
    title: 'Test Post Title',
    body: 'Test post body content',
  },
  ...overrides,
});

describe('PostChangedEventHandler', () => {
  let handler: PostChangedEventHandler;
  let tagPostUseCase: TagPostUseCase;

  beforeEach(() => {
    tagPostUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as TagPostUseCase;

    handler = new PostChangedEventHandler(tagPostUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(tagPostUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith({
      postId: '019682a0-1234-7000-8000-abcdef012345',
      title: 'Test Post Title',
      body: 'Test post body content',
    });
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(tagPostUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: 'not-a-uuid',
            clientId: '019682a0-1234-7000-8000-abcdef012346',
            clientName: 'Test Client',
            title: 'Test Post Title',
            body: 'Test post body content',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
