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
import { ENGAGEMENT_WINDOW_HOURS } from '../../@shared/constant/check-engagement.constant';

const makeAnalyticsLogRepository = (): AnalyticsLogRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  findPostIdsWithRecentViews: vi.fn().mockResolvedValue([]),
  countViewsInRangeBatch: vi.fn().mockResolvedValue(new Map<string, number>()),
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

const stateWithSignal = (postId: PostId, signal: SignalEnum): EngagementState =>
  EngagementState.reconstruct({ postId, lastSignal: new Signal(signal) });

describe('CheckEngagementUseCase', () => {
  let analyticsLogRepository: AnalyticsLogRepository;
  let engagementStateRepository: EngagementStateRepository;
  let dispatcher: EventDispatcher;
  let useCase: CheckEngagementUseCase;

  beforeEach(() => {
    analyticsLogRepository = makeAnalyticsLogRepository();
    engagementStateRepository = makeEngagementStateRepository();
    dispatcher = makeDispatcher();
    useCase = new CheckEngagementUseCase(
      analyticsLogRepository,
      engagementStateRepository,
      dispatcher,
      makeLogger(),
    );
  });

  it('does nothing (no DB writes, no events) when there are no candidates', async () => {
    const rangeSpy = vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch');
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(rangeSpy).not.toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('raises a post with no prior state when views exceed the raise threshold (null → raised)', async () => {
    const postId = new PostId(uuidv7());
    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 15]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

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

  it('raises a previously-dropped post when views exceed the raise threshold (dropped → raised)', async () => {
    const postId = new PostId(uuidv7());
    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([
      stateWithSignal(postId, SignalEnum.dropped),
    ]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 12]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy.mock.calls[0][0][0].lastSignal.toString()).toBe(SignalEnum.raised);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy.mock.calls[0][0]).toBeInstanceOf(PostEngagementRaisedEvent);
  });

  it('does not emit a drop signal for a post that was never raised, even with low views', async () => {
    const postId = new PostId(uuidv7());
    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 1]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not re-emit when an already-raised post still has high views', async () => {
    const postId = new PostId(uuidv7());
    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([
      stateWithSignal(postId, SignalEnum.raised),
    ]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 15]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('drops a raised post when its views fall below the drop threshold (raised → dropped)', async () => {
    const postId = new PostId(uuidv7());
    const state = stateWithSignal(postId, SignalEnum.raised);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([state]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([state]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 2]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy.mock.calls[0][0][0].lastSignal.toString()).toBe(SignalEnum.dropped);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as PostEngagementDroppedEvent;
    expect(event).toBeInstanceOf(PostEngagementDroppedEvent);
    expect(event.payload.postId).toBe(postId.toString());
    expect(event.payload.viewCount).toBe(2);
  });

  it('does not re-emit when an already-dropped post still has low views', async () => {
    const postId = new PostId(uuidv7());
    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([
      stateWithSignal(postId, SignalEnum.dropped),
    ]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 1]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does NOT drop a raised post that still has enough recent views', async () => {
    const postId = new PostId(uuidv7());
    const state = stateWithSignal(postId, SignalEnum.raised);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([state]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([state]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 7]]),
    );
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('requests deleted posts to be excluded from both the raise and drop paths', async () => {
    const recentSpy = vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews');
    const raisedSpy = vi.spyOn(engagementStateRepository, 'findAllRaised');

    await useCase.execute();

    const [windowHours, recentOptions] = recentSpy.mock.calls[0];
    expect(windowHours).toBe(ENGAGEMENT_WINDOW_HOURS);
    expect(recentOptions?.excludeDeleted).toBe(true);
    expect(recentOptions?.now).toBeInstanceOf(Date);
    expect(raisedSpy).toHaveBeenCalledWith({ excludeDeleted: true });
  });

  it('does not raise a post with exactly the raise threshold (must be strictly greater than 10)', async () => {
    const postId = new PostId(uuidv7());
    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 10]]),
    );
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not drop a raised post with exactly the drop threshold (must be strictly below 5)', async () => {
    const postId = new PostId(uuidv7());
    const state = stateWithSignal(postId, SignalEnum.raised);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([state]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([state]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 5]]),
    );
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('issues a single countViewsInRangeBatch call covering all candidates', async () => {
    const raisePost = new PostId(uuidv7());
    const dropPost = new PostId(uuidv7());
    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([raisePost]);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([
      stateWithSignal(dropPost, SignalEnum.raised),
    ]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([
      stateWithSignal(dropPost, SignalEnum.raised),
    ]);
    const rangeSpy = vi
      .spyOn(analyticsLogRepository, 'countViewsInRangeBatch')
      .mockResolvedValue(new Map());

    await useCase.execute();

    expect(rangeSpy).toHaveBeenCalledTimes(1);
    const calledIds = rangeSpy.mock.calls[0][0].map((id) => id.toString());
    expect(calledIds).toContain(raisePost.toString());
    expect(calledIds).toContain(dropPost.toString());
    expect(calledIds).toHaveLength(2);
  });

  it('captures a single point in time reused across window and range queries', async () => {
    const postId = new PostId(uuidv7());
    const recentSpy = vi
      .spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews')
      .mockResolvedValue([postId]);
    const rangeSpy = vi
      .spyOn(analyticsLogRepository, 'countViewsInRangeBatch')
      .mockResolvedValue(new Map([[postId.toString(), 0]]));

    await useCase.execute();

    const findNow = recentSpy.mock.calls[0][1]?.now;
    const rangeTo = rangeSpy.mock.calls[0][2];
    expect(findNow).toBeInstanceOf(Date);
    expect(rangeTo).toStrictEqual(findNow);
  });

  it('calls saveMany before dispatching events', async () => {
    const postId = new PostId(uuidv7());
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

    await useCase.execute();

    expect(callOrder).toEqual(['saveMany', 'dispatch']);
  });

  it('calls findByPostIds with only raise candidates (drop candidates already have state from findAllRaised)', async () => {
    const raisePost = new PostId(uuidv7());
    const dropPost = new PostId(uuidv7());
    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([raisePost]);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([
      stateWithSignal(dropPost, SignalEnum.raised),
    ]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(new Map());
    const findByPostIdsSpy = vi.spyOn(engagementStateRepository, 'findByPostIds');

    await useCase.execute();

    expect(findByPostIdsSpy).toHaveBeenCalledTimes(1);
    const calledWith = findByPostIdsSpy.mock.calls[0][0].map((id) => id.toString());
    expect(calledWith).toContain(raisePost.toString());
    expect(calledWith).not.toContain(dropPost.toString());
    expect(calledWith).toHaveLength(1);
  });

  it('does not raise a post absent from the batch view count result (defaults to 0 views)', async () => {
    const postId = new PostId(uuidv7());
    vi.spyOn(analyticsLogRepository, 'findPostIdsWithRecentViews').mockResolvedValue([postId]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(new Map());
    const saveSpy = vi.spyOn(engagementStateRepository, 'saveMany');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('drops a raised post immediately when its views fall below the drop threshold (no minimum age)', async () => {
    const postId = new PostId(uuidv7());
    const state = stateWithSignal(postId, SignalEnum.raised);
    vi.spyOn(engagementStateRepository, 'findAllRaised').mockResolvedValue([state]);
    vi.spyOn(engagementStateRepository, 'findByPostIds').mockResolvedValue([state]);
    vi.spyOn(analyticsLogRepository, 'countViewsInRangeBatch').mockResolvedValue(
      new Map([[postId.toString(), 0]]),
    );
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy.mock.calls[0][0]).toBeInstanceOf(PostEngagementDroppedEvent);
  });
});
