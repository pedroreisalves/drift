import PostTagsUpdatedEventHandler, {
  postTagsUpdatedMessageSchema,
  type PostTagsUpdatedMessage,
} from './post-tags-updated.event-handler';
import type IndexPostTagsUseCase from '../../usecase/index-post-tags/index-post-tags.use-case';
import { type Logger } from '@drift/shared';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

describe('PostTagsUpdatedEventHandler', () => {
  const makeUseCase = (): IndexPostTagsUseCase =>
    ({ execute: vi.fn().mockResolvedValue(undefined) }) as unknown as IndexPostTagsUseCase;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeValidMessage = (
    overrides: Partial<PostTagsUpdatedMessage> = {},
  ): PostTagsUpdatedMessage => {
    const base: PostTagsUpdatedMessage = {
      eventName: 'PostTagsUpdated',
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: {
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
        tags: ['tech', 'news'],
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    };
    return { ...base, ...overrides };
  };

  it('should delegate to IndexPostTagsUseCase with correct input', async () => {
    const indexPostTagsUseCase = makeUseCase();
    const eventHandler = new PostTagsUpdatedEventHandler(indexPostTagsUseCase, makeLogger());
    const executeSpy = vi.spyOn(indexPostTagsUseCase, 'execute');

    const message = makeValidMessage({
      payload: {
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3e',
        tags: ['rust', 'systems'],
        updatedAt: '2026-06-15T10:30:00.000Z',
      },
    });

    await eventHandler.handle(message);

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const input = executeSpy.mock.calls[0][0];
    expect(input.postId).toBe(message.payload.postId);
    expect(input.tags).toEqual(message.payload.tags);
  });

  it('should reject and not call execute when the message is invalid', async () => {
    const indexPostTagsUseCase = makeUseCase();
    const eventHandler = new PostTagsUpdatedEventHandler(indexPostTagsUseCase, makeLogger());
    const executeSpy = vi.spyOn(indexPostTagsUseCase, 'execute');

    const invalid = makeValidMessage({
      payload: {
        ...makeValidMessage().payload,
        postId: 'not-a-uuid',
      },
    });

    await expect(eventHandler.handle(invalid)).rejects.toThrow();
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should swallow DocumentNotFoundError without rethrowing', async () => {
    const indexPostTagsUseCase = makeUseCase();
    const eventHandler = new PostTagsUpdatedEventHandler(indexPostTagsUseCase, makeLogger());
    vi.spyOn(indexPostTagsUseCase, 'execute').mockRejectedValue(
      new DocumentNotFoundError('01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c'),
    );

    await expect(eventHandler.handle(makeValidMessage())).resolves.toBeUndefined();
  });

  it('should rethrow unexpected errors', async () => {
    const indexPostTagsUseCase = makeUseCase();
    const eventHandler = new PostTagsUpdatedEventHandler(indexPostTagsUseCase, makeLogger());
    vi.spyOn(indexPostTagsUseCase, 'execute').mockRejectedValue(new Error('Unexpected'));

    await expect(eventHandler.handle(makeValidMessage())).rejects.toThrow('Unexpected');
  });

  it('should export a valid schema', () => {
    expect(postTagsUpdatedMessageSchema).toBeDefined();
  });
});
