import type { Logger } from '@drift/shared';
import PostDeletedEventHandler, { type PostDeletedMessage } from './post-deleted.event-handler';
import type RecordAnalyticsEventUseCase from '../../usecase/record-analytics-event/record-analytics-event.use-case';

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<PostDeletedMessage> = {}): PostDeletedMessage => ({
  eventName: 'PostDeleted',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    postId: '019682a0-1234-7000-8000-abcdef012345',
    clientId: '019682a0-1234-7000-8000-abcdef012346',
    deletedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('PostDeletedEventHandler', () => {
  let handler: PostDeletedEventHandler;
  let recordAnalyticsEventUseCase: RecordAnalyticsEventUseCase;

  beforeEach(() => {
    recordAnalyticsEventUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as RecordAnalyticsEventUseCase;

    handler = new PostDeletedEventHandler(recordAnalyticsEventUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(recordAnalyticsEventUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith({
      eventType: 'PostDeleted',
      postId: '019682a0-1234-7000-8000-abcdef012345',
      clientId: '019682a0-1234-7000-8000-abcdef012346',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(recordAnalyticsEventUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            postId: 'not-a-uuid',
            clientId: '019682a0-1234-7000-8000-abcdef012346',
            deletedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
