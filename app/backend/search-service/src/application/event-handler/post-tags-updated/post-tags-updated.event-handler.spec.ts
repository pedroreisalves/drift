import type { Logger } from '@drift/shared';

import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import type IndexPostTagsUseCase from '../../usecase/index-post-tags/index-post-tags.use-case';
import PostTagsUpdatedEventHandler, {
  type PostTagsUpdatedMessage,
} from './post-tags-updated.event-handler';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (
  overrides: Partial<PostTagsUpdatedMessage> = {},
): PostTagsUpdatedMessage => ({
  eventName: 'PostTagsUpdated',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
    tags: ['tech', 'news'],
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('PostTagsUpdatedEventHandler', () => {
  let handler: PostTagsUpdatedEventHandler;
  let indexPostTagsUseCase: IndexPostTagsUseCase;

  beforeEach(() => {
    indexPostTagsUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as IndexPostTagsUseCase;

    handler = new PostTagsUpdatedEventHandler(indexPostTagsUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(indexPostTagsUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
        tags: ['tech', 'news'],
      }),
    );
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(indexPostTagsUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: 'not-a-uuid',
            tags: ['tech', 'news'],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should drop the event when the document no longer exists', async () => {
    vi.spyOn(indexPostTagsUseCase, 'execute').mockRejectedValue(
      new DocumentNotFoundError('01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c'),
    );

    await expect(handler.handle(makeValidMessage())).resolves.toBeUndefined();
  });

  it('should rethrow unexpected errors', async () => {
    const unexpectedError = new Error('Unexpected');
    vi.spyOn(indexPostTagsUseCase, 'execute').mockRejectedValue(unexpectedError);

    await expect(handler.handle(makeValidMessage())).rejects.toThrow(unexpectedError);
  });

  it('should throw when message contains duplicate tags', async () => {
    const executeSpy = vi.spyOn(indexPostTagsUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
            tags: ['dup', 'dup'],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should throw when message contains an empty tag', async () => {
    const executeSpy = vi.spyOn(indexPostTagsUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
            tags: [''],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should throw when message contains more than 10 tags', async () => {
    const executeSpy = vi.spyOn(indexPostTagsUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
            tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
