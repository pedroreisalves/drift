import { uuidv7 } from 'uuidv7';
import PostTagsUpdatedEventHandler, {
  type PostTagsUpdatedMessage,
} from './post-tags-updated.event-handler';
import type IndexPostTagsUseCase from '../../usecase/index-post-tags/index-post-tags.use-case';
import type { Logger } from '@drift/shared';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

describe('PostTagsUpdatedEventHandler', () => {
  const makeUseCase = (): IndexPostTagsUseCase =>
    ({ execute: vi.fn().mockResolvedValue(undefined) }) as unknown as IndexPostTagsUseCase;

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

  it('should delegate to IndexPostTagsUseCase with correct input', async () => {
    const indexPostTagsUseCase = makeUseCase();
    const eventHandler = new PostTagsUpdatedEventHandler(indexPostTagsUseCase, makeLogger());
    const executeSpy = vi.spyOn(indexPostTagsUseCase, 'execute');

    const message = makeMessage({ postId: uuidv7(), tags: ['rust', 'systems'] });
    await eventHandler.handle(message);

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const input = executeSpy.mock.calls[0][0];
    expect(input.postId).toBe(message.payload.postId);
    expect(input.tags).toEqual(message.payload.tags);
  });

  it('should swallow DocumentNotFoundError without rethrowing', async () => {
    const indexPostTagsUseCase = makeUseCase();
    const eventHandler = new PostTagsUpdatedEventHandler(indexPostTagsUseCase, makeLogger());
    vi.spyOn(indexPostTagsUseCase, 'execute').mockRejectedValue(
      new DocumentNotFoundError(uuidv7()),
    );

    await expect(eventHandler.handle(makeMessage())).resolves.toBeUndefined();
  });

  it('should rethrow unexpected errors', async () => {
    const indexPostTagsUseCase = makeUseCase();
    const eventHandler = new PostTagsUpdatedEventHandler(indexPostTagsUseCase, makeLogger());
    vi.spyOn(indexPostTagsUseCase, 'execute').mockRejectedValue(new Error('Unexpected'));

    await expect(eventHandler.handle(makeMessage())).rejects.toThrow('Unexpected');
  });
});
