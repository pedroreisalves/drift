import { uuidv7 } from 'uuidv7';
import PostTagsUpdatedEventHandler, {
  type PostTagsUpdatedMessage,
} from './post-tags-updated.event-handler';
import type IndexPostTagsHandler from '../../command/index-post-tags/index-post-tags.handler';
import type { Logger } from '@drift/shared';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

describe('PostTagsUpdatedEventHandler', () => {
  const makeHandler = (): IndexPostTagsHandler =>
    ({ execute: vi.fn().mockResolvedValue(undefined) }) as unknown as IndexPostTagsHandler;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeMessage = (
    overrides: Partial<PostTagsUpdatedMessage['payload']> = {},
  ): PostTagsUpdatedMessage => ({
    eventName: 'PostTagsUpdated',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      postId: overrides.postId ?? uuidv7(),
      tags: overrides.tags ?? ['tech', 'news'],
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  });

  it('should delegate to IndexPostTagsHandler with correct command', async () => {
    const indexPostTagsHandler = makeHandler();
    const eventHandler = new PostTagsUpdatedEventHandler(indexPostTagsHandler, makeLogger());
    const executeSpy = vi.spyOn(indexPostTagsHandler, 'execute');

    const message = makeMessage({ postId: uuidv7(), tags: ['rust', 'systems'] });
    await eventHandler.handle(message);

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command.postId).toBe(message.payload.postId);
    expect(command.tags).toEqual(message.payload.tags);
  });

  it('should swallow DocumentNotFoundError without rethrowing', async () => {
    const indexPostTagsHandler = makeHandler();
    const eventHandler = new PostTagsUpdatedEventHandler(indexPostTagsHandler, makeLogger());
    vi.spyOn(indexPostTagsHandler, 'execute').mockRejectedValue(
      new DocumentNotFoundError(uuidv7()),
    );

    await expect(eventHandler.handle(makeMessage())).resolves.toBeUndefined();
  });

  it('should rethrow unexpected errors', async () => {
    const indexPostTagsHandler = makeHandler();
    const eventHandler = new PostTagsUpdatedEventHandler(indexPostTagsHandler, makeLogger());
    vi.spyOn(indexPostTagsHandler, 'execute').mockRejectedValue(new Error('Unexpected'));

    await expect(eventHandler.handle(makeMessage())).rejects.toThrow('Unexpected');
  });
});
