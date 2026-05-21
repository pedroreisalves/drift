import { uuidv7 } from 'uuidv7';
import RecordAnalyticsEventUseCase from './record-analytics-event.use-case';
import type AnalyticsLogRepository from '../../../domain/analytics-log/repository/analytics-log.repository';
import type DeletedPostRepository from '../../../domain/analytics-log/repository/deleted-post.repository';
import type { EventDispatcher, Logger } from '@drift/shared';
import AnalyticsLog from '../../../domain/analytics-log/entity/analytics-log.entity';
import AnalyticsEventRecordedEvent from '../../../domain/analytics-log/event/analytics-event-recorded.event';
import { EventTypeEnum } from '../../../domain/analytics-log/value-object/event-type.value-object';

describe('RecordAnalyticsEventUseCase', () => {
  const makeAnalyticsLogRepository = (): AnalyticsLogRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    findPostIdsWithRecentViews: vi.fn().mockResolvedValue([]),
    countViewsInRangeBatch: vi.fn().mockResolvedValue(new Map<string, number>()),
  });

  const makeDeletedPostRepository = (): DeletedPostRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
  });

  const makeDispatcher = (): EventDispatcher => ({
    dispatch: vi.fn().mockResolvedValue(undefined),
  });

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  it('should persist an AnalyticsLog and dispatch AnalyticsEventRecordedEvent', async () => {
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const deletedPostRepository = makeDeletedPostRepository();
    const dispatcher = makeDispatcher();
    const useCase = new RecordAnalyticsEventUseCase(
      analyticsLogRepository,
      deletedPostRepository,
      dispatcher,
      makeLogger(),
    );

    const postId = uuidv7();
    const clientId = uuidv7();
    const timestamp = new Date().toISOString();

    const saveSpy = vi.spyOn(analyticsLogRepository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ eventType: EventTypeEnum.PostViewed, postId, clientId, timestamp });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const persisted = saveSpy.mock.calls[0][0];
    expect(persisted).toBeInstanceOf(AnalyticsLog);
    expect(persisted.eventType.toString()).toBe(EventTypeEnum.PostViewed);
    expect(persisted.postId?.toString()).toBe(postId);
    expect(persisted.clientId.toString()).toBe(clientId);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(AnalyticsEventRecordedEvent));
    const event = dispatchSpy.mock.calls[0][0] as AnalyticsEventRecordedEvent;
    expect(event.payload.eventType).toBe(EventTypeEnum.PostViewed);
    expect(event.payload.postId).toBe(postId);
    expect(event.payload.clientId).toBe(clientId);
  });

  it('should handle null postId for non-post events', async () => {
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const deletedPostRepository = makeDeletedPostRepository();
    const dispatcher = makeDispatcher();
    const useCase = new RecordAnalyticsEventUseCase(
      analyticsLogRepository,
      deletedPostRepository,
      dispatcher,
      makeLogger(),
    );

    const clientId = uuidv7();
    const timestamp = new Date().toISOString();

    const saveSpy = vi.spyOn(analyticsLogRepository, 'save');
    await useCase.execute({
      eventType: EventTypeEnum.PostSearched,
      postId: null,
      clientId,
      timestamp,
    });

    const persisted = saveSpy.mock.calls[0][0];
    expect(persisted.postId).toBeNull();
  });

  it('should also save to deletedPostRepository when eventType is PostDeleted', async () => {
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const deletedPostRepository = makeDeletedPostRepository();
    const dispatcher = makeDispatcher();
    const useCase = new RecordAnalyticsEventUseCase(
      analyticsLogRepository,
      deletedPostRepository,
      dispatcher,
      makeLogger(),
    );

    const postId = uuidv7();
    const clientId = uuidv7();
    const timestamp = new Date().toISOString();

    const deletedSaveSpy = vi.spyOn(deletedPostRepository, 'save');

    await useCase.execute({ eventType: EventTypeEnum.PostDeleted, postId, clientId, timestamp });

    expect(deletedSaveSpy).toHaveBeenCalledTimes(1);
  });

  it('should not save to deletedPostRepository for non-delete events', async () => {
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const deletedPostRepository = makeDeletedPostRepository();
    const useCase = new RecordAnalyticsEventUseCase(
      analyticsLogRepository,
      deletedPostRepository,
      makeDispatcher(),
      makeLogger(),
    );

    const deletedSaveSpy = vi.spyOn(deletedPostRepository, 'save');

    await useCase.execute({
      eventType: EventTypeEnum.PostViewed,
      postId: uuidv7(),
      clientId: uuidv7(),
      timestamp: new Date().toISOString(),
    });

    expect(deletedSaveSpy).not.toHaveBeenCalled();
  });

  it('should call analyticsLogRepository.save before deletedPostRepository.save before dispatcher.dispatch for PostDeleted events', async () => {
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const deletedPostRepository = makeDeletedPostRepository();
    const dispatcher = makeDispatcher();
    const useCase = new RecordAnalyticsEventUseCase(
      analyticsLogRepository,
      deletedPostRepository,
      dispatcher,
      makeLogger(),
    );

    const callOrder: string[] = [];
    vi.spyOn(analyticsLogRepository, 'save').mockImplementation(() => {
      callOrder.push('analyticsLogRepository.save');
      return Promise.resolve();
    });
    vi.spyOn(deletedPostRepository, 'save').mockImplementation(() => {
      callOrder.push('deletedPostRepository.save');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({
      eventType: EventTypeEnum.PostDeleted,
      postId: uuidv7(),
      clientId: uuidv7(),
      timestamp: new Date().toISOString(),
    });

    expect(callOrder).toEqual([
      'analyticsLogRepository.save',
      'deletedPostRepository.save',
      'dispatcher.dispatch',
    ]);
  });

  it('should call repository.save before dispatcher.dispatch', async () => {
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const dispatcher = makeDispatcher();
    const useCase = new RecordAnalyticsEventUseCase(
      analyticsLogRepository,
      makeDeletedPostRepository(),
      dispatcher,
      makeLogger(),
    );

    const callOrder: string[] = [];
    vi.spyOn(analyticsLogRepository, 'save').mockImplementation(() => {
      callOrder.push('repository.save');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({
      eventType: EventTypeEnum.PostViewed,
      postId: uuidv7(),
      clientId: uuidv7(),
      timestamp: new Date().toISOString(),
    });

    expect(callOrder).toEqual(['repository.save', 'dispatcher.dispatch']);
  });
});
