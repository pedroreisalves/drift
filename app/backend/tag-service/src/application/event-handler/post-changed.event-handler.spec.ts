import { uuidv7 } from 'uuidv7';
import PostChangedEventHandler, { type PostChangedMessage } from './post-changed.event-handler';
import TagPostCommand from '../command/tag-post/tag-post.command';
import type TagPostHandler from '../command/tag-post/tag-post.handler';
import { type Logger } from '@drift/shared';

describe('PostChangedEventHandler', () => {
  const makeTagPostHandler = (): TagPostHandler =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as TagPostHandler;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeMessage = (
    overrides: Partial<PostChangedMessage['payload']> = {},
  ): PostChangedMessage => ({
    eventName: 'PostCreated',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      postId: overrides.postId ?? uuidv7(),
      clientId: overrides.clientId ?? uuidv7(),
      clientName: overrides.clientName ?? 'John Doe',
      title: overrides.title ?? 'My Post Title',
      body: overrides.body ?? 'This is the post body content.',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  });

  it('should invoke TagPostHandler.execute with a command built from the message payload', async () => {
    const tagPostHandler = makeTagPostHandler();
    const eventHandler = new PostChangedEventHandler(tagPostHandler, makeLogger());

    const postId = uuidv7();
    const title = 'My Specific Title';
    const body = 'My specific body content.';

    const executeSpy = vi.spyOn(tagPostHandler, 'execute');

    await eventHandler.handle(makeMessage({ postId, title, body }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(TagPostCommand);
    expect(command.postId).toBe(postId);
    expect(command.title).toBe(title);
    expect(command.body).toBe(body);
  });
});
