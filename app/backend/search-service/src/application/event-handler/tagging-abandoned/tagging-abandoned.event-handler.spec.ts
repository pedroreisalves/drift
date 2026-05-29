import type { Logger } from '@drift/shared';

import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import type UpdateSearchEntryTaggingStatusUseCase from '../../usecase/update-search-entry-tagging-status/update-search-entry-tagging-status.use-case';
import TaggingAbandonedEventHandler, {
  type TaggingAbandonedMessage,
} from './tagging-abandoned.event-handler';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (
  overrides: Partial<TaggingAbandonedMessage> = {},
): TaggingAbandonedMessage => ({
  eventName: 'TaggingAbandoned',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    taggingProcessId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
    postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
    retryCount: 3,
    reason: 'ollama unreachable',
    abandonedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('TaggingAbandonedEventHandler', () => {
  let handler: TaggingAbandonedEventHandler;
  let useCase: UpdateSearchEntryTaggingStatusUseCase;

  beforeEach(() => {
    useCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as UpdateSearchEntryTaggingStatusUseCase;

    handler = new TaggingAbandonedEventHandler(useCase, makeLogger());
  });

  it('should call use case with isTaggingInProgress: false when message is valid', async () => {
    const executeSpy = vi.spyOn(useCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith({
      postId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c',
      isTaggingInProgress: false,
    });
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(useCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            taggingProcessId: '01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3d',
            postId: 'not-a-uuid',
            retryCount: 3,
            reason: 'ollama unreachable',
            abandonedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should drop the event when the document no longer exists', async () => {
    vi.spyOn(useCase, 'execute').mockRejectedValue(
      new DocumentNotFoundError('01944d6e-6b1a-7f4b-a9c2-3e8d5f1a2b3c'),
    );

    await expect(handler.handle(makeValidMessage())).resolves.toBeUndefined();
  });

  it('should rethrow unexpected errors', async () => {
    const unexpectedError = new Error('Unexpected');
    vi.spyOn(useCase, 'execute').mockRejectedValue(unexpectedError);

    await expect(handler.handle(makeValidMessage())).rejects.toThrow(unexpectedError);
  });
});
