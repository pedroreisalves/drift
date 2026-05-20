import { uuidv7 } from 'uuidv7';
import PostChangedEventHandler, { type PostChangedMessage } from './post-changed.event-handler';
import type TagPostUseCase from '../../usecase/tag-post/tag-post.use-case';
import { type Logger } from '@drift/shared';

describe('PostChangedEventHandler', () => {
  const makeTagPostUseCase = (): TagPostUseCase =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as TagPostUseCase;

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

  it('should invoke TagPostUseCase.execute with input built from the message payload', async () => {
    const tagPostUseCase = makeTagPostUseCase();
    const eventHandler = new PostChangedEventHandler(tagPostUseCase, makeLogger());

    const postId = uuidv7();
    const title = 'My Specific Title';
    const body = 'My specific body content.';

    const executeSpy = vi.spyOn(tagPostUseCase, 'execute');

    await eventHandler.handle(makeMessage({ postId, title, body }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).toHaveBeenCalledWith({ postId, title, body });
  });
});
