import PostCreatedEventHandler, {
  postCreatedMessageSchema,
  type PostCreatedMessage,
} from './post-created.event-handler';
import type IndexPostUseCase from '../../usecase/index-post/index-post.use-case';
import { type Logger } from '@drift/shared';

describe('PostCreatedEventHandler', () => {
  const makeIndexPostUseCase = (): IndexPostUseCase =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as IndexPostUseCase;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeValidMessage = (overrides: Partial<PostCreatedMessage> = {}): PostCreatedMessage => {
    const base: PostCreatedMessage = {
      eventName: 'PostCreated',
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: {
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
        clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
        title: 'My Post Title',
        body: 'Post body content.',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    };
    return { ...base, ...overrides };
  };

  it('should invoke IndexPostUseCase.execute with input built from the message payload', async () => {
    const indexPostUseCase = makeIndexPostUseCase();
    const eventHandler = new PostCreatedEventHandler(indexPostUseCase, makeLogger());
    const executeSpy = vi.spyOn(indexPostUseCase, 'execute');

    const message = makeValidMessage({
      payload: {
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3e',
        clientId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3f',
        title: 'Specific Title',
        body: 'Specific body.',
        createdAt: '2026-01-01T00:00:00.000Z',
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
    const indexPostUseCase = makeIndexPostUseCase();
    const eventHandler = new PostCreatedEventHandler(indexPostUseCase, makeLogger());
    const executeSpy = vi.spyOn(indexPostUseCase, 'execute');

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
    expect(postCreatedMessageSchema).toBeDefined();
  });
});
