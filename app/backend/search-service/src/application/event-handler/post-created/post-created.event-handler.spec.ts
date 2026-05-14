import { uuidv7 } from 'uuidv7';
import PostCreatedEventHandler, { type PostCreatedMessage } from './post-created.event-handler';
import IndexPostCommand from '../../command/index-post/index-post.command';
import type IndexPostHandler from '../../command/index-post/index-post.handler';
import { type Logger } from '@drift/shared';

describe('PostCreatedEventHandler', () => {
  const makeIndexPostHandler = (): IndexPostHandler =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as IndexPostHandler;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeMessage = (overrides: Partial<PostCreatedMessage['payload']> = {}): PostCreatedMessage => ({
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

  it('should invoke IndexPostHandler.execute with a command built from the message payload', async () => {
    const indexPostHandler = makeIndexPostHandler();
    const eventHandler = new PostCreatedEventHandler(indexPostHandler, makeLogger());

    const postId = uuidv7();
    const title = 'My Specific Title';
    const body = 'My specific body content.';

    const executeSpy = vi.spyOn(indexPostHandler, 'execute');

    await eventHandler.handle(makeMessage({ postId, title, body }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(IndexPostCommand);
    expect(command.postId).toBe(postId);
    expect(command.title).toBe(title);
    expect(command.body).toBe(body);
  });
});
