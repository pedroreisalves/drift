import type { Logger } from '@drift/shared';

import type RecordAnalyticsEventUseCase from '../../usecase/record-analytics-event/record-analytics-event.use-case';
import PostSearchedEventHandler, { type PostSearchedMessage } from './post-searched.event-handler';

const VALID_CLIENT_HASH = 'c'.repeat(64);

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<PostSearchedMessage> = {}): PostSearchedMessage => ({
  eventName: 'PostSearched',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    query: 'typescript patterns',
    clientHash: VALID_CLIENT_HASH,
    resultCount: 42,
    searchedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('PostSearchedEventHandler', () => {
  let handler: PostSearchedEventHandler;
  let recordAnalyticsEventUseCase: RecordAnalyticsEventUseCase;

  beforeEach(() => {
    recordAnalyticsEventUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as RecordAnalyticsEventUseCase;

    handler = new PostSearchedEventHandler(recordAnalyticsEventUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(recordAnalyticsEventUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith({
      eventType: 'PostSearched',
      postId: null,
      clientHash: VALID_CLIENT_HASH,
      timestamp: '2026-01-01T00:00:00.000Z',
    });
  });

  it('should throw when message is invalid', async () => {
    const executeSpy = vi.spyOn(recordAnalyticsEventUseCase, 'execute');

    await expect(
      handler.handle(
        makeValidMessage({
          payload: {
            query: 'typescript patterns',
            clientHash: VALID_CLIENT_HASH,
            resultCount: 'not-a-number',
            searchedAt: '2026-01-01T00:00:00.000Z',
          } as unknown as PostSearchedMessage['payload'],
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
