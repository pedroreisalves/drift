import { ClientHash, type EventDispatcher, type Logger } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import AnalyticsLog from '../../../domain/analytics-log/entity/analytics-log.entity';
import type AnalyticsLogRepository from '../../../domain/analytics-log/repository/analytics-log.repository';
import type DeletedPostRepository from '../../../domain/analytics-log/repository/deleted-post.repository';
import type EngagementStateRepository from '../../../domain/analytics-log/repository/engagement-state.repository';
import type PostLastUpdatedRepository from '../../../domain/analytics-log/repository/post-last-updated.repository';
import type PostOwnerRepository from '../../../domain/analytics-log/repository/post-owner.repository';
import { EventTypeEnum } from '../../../domain/analytics-log/value-object/event-type.value-object';
import RecordAnalyticsEventUseCase from './record-analytics-event.use-case';

const VALID_CLIENT_HASH = 'b'.repeat(64);

const makeAnalyticsLogRepository = (): AnalyticsLogRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  findPostIdsWithRecentViews: vi.fn().mockResolvedValue([]),
  countViewsInRangeBatch: vi.fn().mockResolvedValue(new Map<string, number>()),
});

const makeDeletedPostRepository = (): DeletedPostRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
});

const makePostOwnerRepository = (): PostOwnerRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
});

const makePostLastUpdatedRepository = (): PostLastUpdatedRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
});

const makeEngagementStateRepository = (): EngagementStateRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  saveMany: vi.fn().mockResolvedValue(undefined),
  findByPostIds: vi.fn().mockResolvedValue([]),
  findAllRaised: vi.fn().mockResolvedValue([]),
});

const makeDispatcher = (): EventDispatcher => ({
  dispatch: vi.fn().mockResolvedValue(undefined),
});

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('RecordAnalyticsEventUseCase', () => {
  let analyticsLogRepository: AnalyticsLogRepository;
  let deletedPostRepository: DeletedPostRepository;
  let postOwnerRepository: PostOwnerRepository;
  let postLastUpdatedRepository: PostLastUpdatedRepository;
  let engagementStateRepository: EngagementStateRepository;
  let dispatcher: EventDispatcher;
  let useCase: RecordAnalyticsEventUseCase;

  beforeEach(() => {
    analyticsLogRepository = makeAnalyticsLogRepository();
    deletedPostRepository = makeDeletedPostRepository();
    postOwnerRepository = makePostOwnerRepository();
    postLastUpdatedRepository = makePostLastUpdatedRepository();
    engagementStateRepository = makeEngagementStateRepository();
    dispatcher = makeDispatcher();
    useCase = new RecordAnalyticsEventUseCase(
      analyticsLogRepository,
      deletedPostRepository,
      postOwnerRepository,
      postLastUpdatedRepository,
      engagementStateRepository,
      dispatcher,
      makeLogger(),
    );
  });

  it('should persist an AnalyticsLog and dispatch AnalyticsEventRecordedEvent', async () => {
    const postId = uuidv7();
    const clientHash = VALID_CLIENT_HASH;
    const timestamp = new Date().toISOString();

    const saveSpy = vi.spyOn(analyticsLogRepository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ eventType: EventTypeEnum.PostViewed, postId, clientHash, timestamp });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const persisted = saveSpy.mock.calls[0][0];
    expect(persisted).toBeInstanceOf(AnalyticsLog);
    expect(persisted.eventType.toString()).toBe(EventTypeEnum.PostViewed);
    expect(persisted.postId?.toString()).toBe(postId);
    expect(persisted.clientHash.toString()).toBe(clientHash);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const dispatched = dispatchSpy.mock.calls[0][0] as unknown as {
      payload: { eventType: string; postId: string; clientHash: string };
    };
    expect(dispatched.payload.eventType).toBe(EventTypeEnum.PostViewed);
    expect(dispatched.payload.postId).toBe(postId);
    expect(dispatched.payload.clientHash).toBe(clientHash);
  });

  it('should handle null postId for non-post events', async () => {
    const clientHash = VALID_CLIENT_HASH;
    const timestamp = new Date().toISOString();

    const saveSpy = vi.spyOn(analyticsLogRepository, 'save');
    await useCase.execute({
      eventType: EventTypeEnum.PostSearched,
      postId: null,
      clientHash,
      timestamp,
    });

    const persisted = saveSpy.mock.calls[0][0];
    expect(persisted.postId).toBeNull();
  });

  it('should also save to deletedPostRepository when eventType is PostDeleted', async () => {
    const postId = uuidv7();
    const clientHash = VALID_CLIENT_HASH;
    const timestamp = new Date().toISOString();

    const deletedSaveSpy = vi.spyOn(deletedPostRepository, 'save');

    await useCase.execute({ eventType: EventTypeEnum.PostDeleted, postId, clientHash, timestamp });

    expect(deletedSaveSpy).toHaveBeenCalledTimes(1);
  });

  it('should not save to deletedPostRepository for non-delete events', async () => {
    const deletedSaveSpy = vi.spyOn(deletedPostRepository, 'save');

    await useCase.execute({
      eventType: EventTypeEnum.PostViewed,
      postId: uuidv7(),
      clientHash: VALID_CLIENT_HASH,
      timestamp: new Date().toISOString(),
    });

    expect(deletedSaveSpy).not.toHaveBeenCalled();
  });

  it('should call analyticsLogRepository.save before deletedPostRepository.save before dispatcher.dispatch for PostDeleted events', async () => {
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
      clientHash: VALID_CLIENT_HASH,
      timestamp: new Date().toISOString(),
    });

    expect(callOrder).toEqual([
      'analyticsLogRepository.save',
      'deletedPostRepository.save',
      'dispatcher.dispatch',
    ]);
  });

  it('should call repository.save before dispatcher.dispatch', async () => {
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
      clientHash: VALID_CLIENT_HASH,
      timestamp: new Date().toISOString(),
    });

    expect(callOrder).toEqual(['repository.save', 'dispatcher.dispatch']);
  });

  it('should save to postOwnerRepository when eventType is PostCreated', async () => {
    const postId = uuidv7();
    const clientHash = VALID_CLIENT_HASH;
    const ownerSaveSpy = vi.spyOn(postOwnerRepository, 'save');

    await useCase.execute({
      eventType: EventTypeEnum.PostCreated,
      postId,
      clientHash,
      timestamp: new Date().toISOString(),
    });

    expect(ownerSaveSpy).toHaveBeenCalledTimes(1);
    expect(ownerSaveSpy.mock.calls[0][0].toString()).toBe(postId);
    expect(ownerSaveSpy.mock.calls[0][1]).toBeInstanceOf(ClientHash);
    expect(ownerSaveSpy.mock.calls[0][1].toString()).toBe(clientHash);
  });

  it('should not save to postOwnerRepository for non-PostCreated events', async () => {
    const ownerSaveSpy = vi.spyOn(postOwnerRepository, 'save');

    await useCase.execute({
      eventType: EventTypeEnum.PostViewed,
      postId: uuidv7(),
      clientHash: VALID_CLIENT_HASH,
      timestamp: new Date().toISOString(),
    });

    expect(ownerSaveSpy).not.toHaveBeenCalled();
  });

  it('should call analyticsLogRepository.save before postOwnerRepository.save before dispatcher.dispatch for PostCreated events', async () => {
    const callOrder: string[] = [];
    vi.spyOn(analyticsLogRepository, 'save').mockImplementation(() => {
      callOrder.push('analyticsLogRepository.save');
      return Promise.resolve();
    });
    vi.spyOn(postOwnerRepository, 'save').mockImplementation(() => {
      callOrder.push('postOwnerRepository.save');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({
      eventType: EventTypeEnum.PostCreated,
      postId: uuidv7(),
      clientHash: VALID_CLIENT_HASH,
      timestamp: new Date().toISOString(),
    });

    expect(callOrder).toEqual([
      'analyticsLogRepository.save',
      'postOwnerRepository.save',
      'dispatcher.dispatch',
    ]);
  });

  it('should save to postLastUpdatedRepository when eventType is PostUpdated', async () => {
    const postId = uuidv7();
    const clientHash = VALID_CLIENT_HASH;
    const timestamp = '2026-01-01T00:00:00.000Z';
    const saveSpy = vi.spyOn(postLastUpdatedRepository, 'save');

    await useCase.execute({ eventType: EventTypeEnum.PostUpdated, postId, clientHash, timestamp });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy.mock.calls[0][0].toString()).toBe(postId);
    expect(saveSpy.mock.calls[0][1]).toEqual(new Date(timestamp));
  });

  it('should not save to postLastUpdatedRepository for non-PostUpdated events', async () => {
    const saveSpy = vi.spyOn(postLastUpdatedRepository, 'save');

    await useCase.execute({
      eventType: EventTypeEnum.PostViewed,
      postId: uuidv7(),
      clientHash: VALID_CLIENT_HASH,
      timestamp: new Date().toISOString(),
    });

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should call analyticsLogRepository.save before postLastUpdatedRepository.save before engagementStateRepository.save before dispatcher.dispatch for PostUpdated events', async () => {
    const callOrder: string[] = [];
    vi.spyOn(analyticsLogRepository, 'save').mockImplementation(() => {
      callOrder.push('analyticsLogRepository.save');
      return Promise.resolve();
    });
    vi.spyOn(postLastUpdatedRepository, 'save').mockImplementation(() => {
      callOrder.push('postLastUpdatedRepository.save');
      return Promise.resolve();
    });
    vi.spyOn(engagementStateRepository, 'save').mockImplementation(() => {
      callOrder.push('engagementStateRepository.save');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({
      eventType: EventTypeEnum.PostUpdated,
      postId: uuidv7(),
      clientHash: VALID_CLIENT_HASH,
      timestamp: new Date().toISOString(),
    });

    expect(callOrder).toEqual([
      'analyticsLogRepository.save',
      'postLastUpdatedRepository.save',
      'engagementStateRepository.save',
      'dispatcher.dispatch',
    ]);
  });

  it('should save a dropped EngagementState via engagementStateRepository.save when eventType is PostUpdated', async () => {
    const postId = uuidv7();
    const clientHash = VALID_CLIENT_HASH;
    const timestamp = '2026-01-01T00:00:00.000Z';
    const saveSpy = vi.spyOn(engagementStateRepository, 'save');

    await useCase.execute({ eventType: EventTypeEnum.PostUpdated, postId, clientHash, timestamp });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const savedState = saveSpy.mock.calls[0][0];
    expect(savedState.postId.toString()).toBe(postId);
    expect(savedState.lastSignal.toString()).toBe('dropped');
  });

  it('should not call engagementStateRepository.save for non-PostUpdated events', async () => {
    const saveSpy = vi.spyOn(engagementStateRepository, 'save');

    await useCase.execute({
      eventType: EventTypeEnum.PostViewed,
      postId: uuidv7(),
      clientHash: VALID_CLIENT_HASH,
      timestamp: new Date().toISOString(),
    });

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
