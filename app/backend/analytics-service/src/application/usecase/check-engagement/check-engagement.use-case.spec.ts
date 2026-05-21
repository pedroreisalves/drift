import { uuidv7 } from 'uuidv7';
import { PostId } from '@drift/shared';
import CheckEngagementUseCase from './check-engagement.use-case';
import type AnalyticsLogRepository from '../../../domain/analytics-log/repository/analytics-log.repository';
import type EngagementStateRepository from '../../../domain/analytics-log/repository/engagement-state.repository';
import type { EventDispatcher, Logger } from '@drift/shared';
import EngagementState from '../../../domain/analytics-log/entity/engagement-state.entity';
import Signal, { SignalEnum } from '../../../domain/analytics-log/value-object/signal.value-object';
import PostEngagementRaisedEvent from '../../../domain/analytics-log/event/post-engagement-raised.event';
import PostEngagementDroppedEvent from '../../../domain/analytics-log/event/post-engagement-dropped.event';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

describe('CheckEngagementUseCase', () => {
  const makeAnalyticsLogRepository = (): AnalyticsLogRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    findPostIdsWithRecentViews: vi.fn().mockResolvedValue([]),
    countViewsInRangeBatch: vi.fn().mockResolvedValue(new Map<string, number>()),
  });

  const makeEngagementStateRepository = (): EngagementStateRepository => ({
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

  const makeUseCase = (
    overrides: {
      analyticsLogRepository?: AnalyticsLogRepository;
      engagementStateRepository?: EngagementStateRepository;
      dispatcher?: EventDispatcher;
      logger?: Logger;
    } = {},
  ): CheckEngagementUseCase =>
    new CheckEngagementUseCase(
      overrides.analyticsLogRepository ?? makeAnalyticsLogRepository(),
      overrides.engagementStateRepository ?? makeEngagementStateRepository(),
      overrides.dispatcher ?? makeDispatcher(),
      overrides.logger ?? makeLogger(),
    );

  const raisedState = (postId: PostId, hoursAgo = 49): EngagementState => {
    const updatedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return EngagementState.reconstruct({
      postId,
      lastSignal: new Signal(SignalEnum.raised),
      updatedAt,
    });
  };

  it('does nothing (no DB writes, no events) when there are no candidates', async () => {
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();
    const dispatcher = makeDispatcher();

    const rangeSpy = vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch');
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository, dispatcher }).execute();

    expect(rangeSpy).not.toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('raises an active post that has more than the raise threshold views in the last 24h', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();
    const dispatcher = makeDispatcher();

    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 15]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository, dispatcher }).execute();

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const savedStates = saveSpy.mock.calls[0][0];
    expect(savedStates).toHaveLength(1);
    expect(savedStates[0].lastSignal.toString()).toBe(SignalEnum.raised);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as PostEngagementRaisedEvent;
    expect(event).toBeInstanceOf(PostEngagementRaisedEvent);
    expect(event.payload.postId).toBe(postId.toString());
    expect(event.payload.viewCount).toBe(15);
  });

  it('does nothing when an active post above the raise threshold is already raised', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();
    const dispatcher = makeDispatcher();

    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([raisedState(postId)]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([raisedState(postId)]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 15]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository, dispatcher }).execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('drops a raised post that has been featured for ≥48h and has fewer than 5 recent views', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();
    const dispatcher = makeDispatcher();

    const state = raisedState(postId, 49);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([state]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([state]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 2]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository, dispatcher }).execute();

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy.mock.calls[0][0][0].lastSignal.toString()).toBe(SignalEnum.dropped);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as PostEngagementDroppedEvent;
    expect(event).toBeInstanceOf(PostEngagementDroppedEvent);
    expect(event.payload.postId).toBe(postId.toString());
    expect(event.payload.viewCount).toBe(2);
  });

  it('does NOT drop a raised post that has been featured for less than 48h, even with low views', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();
    const dispatcher = makeDispatcher();

    const state = raisedState(postId, 24);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([state]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([state]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 1]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository, dispatcher }).execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does NOT drop a raised post that is ≥48h old but still has enough recent views', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();
    const dispatcher = makeDispatcher();

    const state = raisedState(postId, 72);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([state]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([state]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 7]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository, dispatcher }).execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('requests deleted posts to be excluded from both the raise and drop paths', async () => {
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();

    const recentSpy = vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews');
    const raisedSpy = vi.spyOn(engagementStateRepository, 'findAllRaised');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository }).execute();

    const [windowHours, recentOptions] = recentSpy.mock.calls[0];
    expect(windowHours).toBe(24);
    expect(recentOptions?.excludeDeleted).toBe(true);
    expect(recentOptions?.now).toBeInstanceOf(Date);
    expect(raisedSpy).toHaveBeenCalledWith({ excludeDeleted: true });
  });

  it('does not raise a post with exactly the raise threshold (must be strictly greater than 10)', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const dispatcher = makeDispatcher();

    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 10]]),
    );
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await makeUseCase({ analyticsLogRepository, dispatcher }).execute();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not drop a raised post with exactly the drop threshold (must be strictly below 5)', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();
    const dispatcher = makeDispatcher();

    const state = raisedState(postId, 49);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([state]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([state]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 5]]),
    );
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository, dispatcher }).execute();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('issues a single countViewsInRangeBatch call covering all candidates', async () => {
    const raisePost = new PostId(uuidv7());
    const dropPost = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();

    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([raisePost]);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([raisedState(dropPost)]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([raisedState(dropPost)]);
    const rangeSpy = vi
      .spyOn(analyticsLogRepository, 'countViewsInRangeBatch')
      .mockResolvedValue(new Map());

    await makeUseCase({ analyticsLogRepository, engagementStateRepository }).execute();

    expect(rangeSpy).toHaveBeenCalledTimes(1);
    const calledIds = rangeSpy.mock.calls[0][0].map((id) => id.toString());
    expect(calledIds).toContain(raisePost.toString());
    expect(calledIds).toContain(dropPost.toString());
    expect(calledIds).toHaveLength(2);
  });

  it('captures a single point in time reused across window and range queries', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();

    const recentSpy = vi
      .spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews')
      .mockResolvedValue([postId]);
    const rangeSpy = vi
      .spyOn(analyticsLogRepository, 'countViewsInRangeBatch')
      .mockResolvedValue(new Map([[postId.toString(), 0]]));

    await makeUseCase({ analyticsLogRepository }).execute();

    const findNow = recentSpy.mock.calls[0][1]?.now;
    const rangeTo = rangeSpy.mock.calls[0][2];
    expect(findNow).toBeInstanceOf(Date);
    expect(rangeTo).toStrictEqual(findNow);
  });

  it('calls saveMany before dispatching events', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();
    const dispatcher = makeDispatcher();

    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 15]]),
    );

    const callOrder: string[] = [];
    vi.spyOn(engagementStateRepository, 'saveMany').mockImplementation(() => {
      callOrder.push('saveMany');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatch');
      return Promise.resolve();
    });

    await makeUseCase({ analyticsLogRepository, engagementStateRepository, dispatcher }).execute();

    expect(callOrder).toEqual(['saveMany', 'dispatch']);
  });

  it('calls findByPostIds with only raise candidates (drop candidates already have state from findAllRaised)', async () => {
    const raisePost = new PostId(uuidv7());
    const dropPost = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();

    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([raisePost]);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([raisedState(dropPost)]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(new Map());
    const findByPostIdsSpy = vi.spyOn(engagementStateRepository, 'findByPostIds');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository }).execute();

    expect(findByPostIdsSpy).toHaveBeenCalledTimes(1);
    const calledWith = findByPostIdsSpy.mock.calls[0][0].map((id) => id.toString());
    expect(calledWith).toContain(raisePost.toString());
    expect(calledWith).not.toContain(dropPost.toString());
    expect(calledWith).toHaveLength(1);
  });

  it('does not raise a post absent from the batch view count result (defaults to 0 views)', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();
    const dispatcher = makeDispatcher();

    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(new Map());
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository, dispatcher }).execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('stamps saved state updatedAt within the run window for both raise and drop', async () => {
    const raisePost = new PostId(uuidv7());
    const dropPost = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();

    const dropState = raisedState(dropPost, 49);
    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([raisePost]);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([dropState]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([dropState]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([
        [raisePost.toString(), 20],
        [dropPost.toString(), 2],
      ]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');

    const before = Date.now();
    await makeUseCase({ analyticsLogRepository, engagementStateRepository }).execute();
    const after = Date.now();

    const savedStates = saveSpy.mock.calls[0][0];
    expect(savedStates).toHaveLength(2);

    const byPost = new Map(savedStates.map((state) => [state.postId.toString(), state]));
    expect(byPost.get(raisePost.toString())?.lastSignal.toString()).toBe(SignalEnum.raised);
    expect(byPost.get(dropPost.toString())?.lastSignal.toString()).toBe(SignalEnum.dropped);

    for (const state of savedStates) {
      expect(state.updatedAt).toBeInstanceOf(Date);
      expect(state.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(state.updatedAt.getTime()).toBeLessThanOrEqual(after);
    }
  });

  it('uses updatedAt from EngagementState to determine 48h promotion age', async () => {
    const postId = new PostId(uuidv7());
    const analyticsLogRepository = makeAnalyticsLogRepository();
    const engagementStateRepository = makeEngagementStateRepository();
    const dispatcher = makeDispatcher();

    const exactlyAt48h = new Date(Date.now() - FORTY_EIGHT_HOURS_MS);
    const state = EngagementState.reconstruct({
      postId,
      lastSignal: new Signal(SignalEnum.raised),
      updatedAt: exactlyAt48h,
    });

    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([state]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([state]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 0]]),
    );
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await makeUseCase({ analyticsLogRepository, engagementStateRepository, dispatcher }).execute();

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy.mock.calls[0][0]).toBeInstanceOf(PostEngagementDroppedEvent);
  });
});
