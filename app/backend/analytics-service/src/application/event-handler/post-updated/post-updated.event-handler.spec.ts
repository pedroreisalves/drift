import type { Logger } from '@drift/shared';

import type RecordAnalyticsEventUseCase from '../../usecase/record-analytics-event/record-analytics-event.use-case';
import PostUpdatedEventHandler, { type PostUpdatedMessage } from './post-updated.event-handler';

const VALID_CLIENT_HASH = 'c'.repeat(64);

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeValidMessage = (overrides: Partial<PostUpdatedMessage> = {}): PostUpdatedMessage => ({
  eventName: 'PostUpdated',
  occurredAt: '2026-01-01T00:00:00.000Z',
  payload: {
    postId: '019682a0-1234-7000-8000-abcdef012345',
    clientHash: VALID_CLIENT_HASH,
    title: 'Updated title',
    body: 'Updated body',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  ...overrides,
});

describe('PostUpdatedEventHandler', () => {
  let handler: PostUpdatedEventHandler;
  let recordAnalyticsEventUseCase: RecordAnalyticsEventUseCase;

  beforeEach(() => {
    recordAnalyticsEventUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as RecordAnalyticsEventUseCase;

    handler = new PostUpdatedEventHandler(recordAnalyticsEventUseCase, makeLogger());
  });

  it('should call use case with correct input when message is valid', async () => {
    const executeSpy = vi.spyOn(recordAnalyticsEventUseCase, 'execute');

    await handler.handle(makeValidMessage());

    expect(executeSpy).toHaveBeenCalledWith({
      eventType: 'PostUpdated',
      postId: '019682a0-1234-7000-8000-abcdef012345',
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
            postId: 'not-a-uuid',
            clientHash: VALID_CLIENT_HASH,
            title: 'Updated title',
            body: 'Updated body',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).rejects.toThrow();

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
