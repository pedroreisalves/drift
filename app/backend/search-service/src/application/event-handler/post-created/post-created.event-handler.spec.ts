import { uuidv7 } from 'uuidv7';
import PostCreatedEventHandler, { type PostCreatedMessage } from './post-created.event-handler';
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

  const makeMessage = (
    overrides: Partial<PostCreatedMessage['payload']> = {},
  ): PostCreatedMessage => ({
    eventName: 'PostCreated',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      postId: overrides.postId ?? uuidv7(),
      clientId: overrides.clientId ?? uuidv7(),
      clientName: overrides.clientName ?? 'John Doe',
      title: overrides.title ?? 'My Post Title',
      body: overrides.body ?? 'Post body content.',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  });

  it('should invoke IndexPostUseCase.execute with input built from the message payload', async () => {
    const indexPostUseCase = makeIndexPostUseCase();
    const eventHandler = new PostCreatedEventHandler(indexPostUseCase, makeLogger());

    const postId = uuidv7();
    const title = 'My Specific Title';
    const body = 'My specific body content.';

    const executeSpy = vi.spyOn(indexPostUseCase, 'execute');

    await eventHandler.handle(makeMessage({ postId, title, body }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const input = executeSpy.mock.calls[0][0];
    expect(input.postId).toBe(postId);
    expect(input.title).toBe(title);
    expect(input.body).toBe(body);
  });
});
