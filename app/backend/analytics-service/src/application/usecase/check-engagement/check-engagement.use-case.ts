import type { DomainEvent, EventDispatcher, Logger, PostId, UseCase } from '@drift/shared';
import type AnalyticsLogRepository from '../../../domain/analytics-log/repository/analytics-log.repository';
import type EngagementStateRepository from '../../../domain/analytics-log/repository/engagement-state.repository';
import EngagementState from '../../../domain/analytics-log/entity/engagement-state.entity';
import PostEngagementRaisedEvent from '../../../domain/analytics-log/event/post-engagement-raised.event';
import Signal, { SignalEnum } from '../../../domain/analytics-log/value-object/signal.value-object';
import PostEngagementDroppedEvent from '../../../domain/analytics-log/event/post-engagement-dropped.event';
import {
  ENGAGEMENT_WINDOW_HOURS,
  RAISE_THRESHOLD,
  DROP_THRESHOLD,
  PROMOTION_MIN_AGE_MS,
} from '../../@shared/constant/check-engagement.constant';

export default class CheckEngagementUseCase implements UseCase<void, void> {
  constructor(
    private readonly analyticsLogRepository: AnalyticsLogRepository,
    private readonly engagementStateRepository: EngagementStateRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(): Promise<void> {
    const startedAt = Date.now();
    const now = new Date();

    const windowFrom = new Date(now.getTime() - ENGAGEMENT_WINDOW_HOURS * 60 * 60 * 1000);

    const [activeIds, raisedStates] = await Promise.all([
      this.analyticsLogRepository.findPostIdsWithRecentViews(ENGAGEMENT_WINDOW_HOURS, {
        excludeDeleted: true,
        now,
      }),
      this.engagementStateRepository.findAllRaised({ excludeDeleted: true }),
    ]);

    const raisedSet = new Set(raisedStates.map((s) => s.postId.toString()));
    const raiseCandidates = activeIds.filter((id) => !raisedSet.has(id.toString()));
    const dropCandidates = raisedStates;

    if (raiseCandidates.length === 0 && dropCandidates.length === 0) {
      this.logger.info('Checking engagement', {
        candidateCount: 0,
        raiseCandidateCount: 0,
        dropCandidateCount: 0,
      });
      return;
    }

    this.logger.info('Checking engagement', {
      candidateCount: raiseCandidates.length + dropCandidates.length,
      raiseCandidateCount: raiseCandidates.length,
      dropCandidateCount: dropCandidates.length,
    });

    const dropCandidateIds = dropCandidates.map((s) => s.postId);
    const allCandidateIds: PostId[] = [...raiseCandidates, ...dropCandidateIds];

    const [viewCounts, raiseExistingStates] = await Promise.all([
      this.analyticsLogRepository.countViewsInRangeBatch(allCandidateIds, windowFrom, now),
      this.engagementStateRepository.findByPostIds(raiseCandidates),
    ]);

    const stateByPostId = new Map<string, EngagementState>(
      dropCandidates.map((state) => [state.postId.toString(), state]),
    );
    for (const state of raiseExistingStates) {
      stateByPostId.set(state.postId.toString(), state);
    }

    const statesToSave: EngagementState[] = [];
    const events: DomainEvent[] = [];
    let raisedCount = 0;
    let droppedCount = 0;

    for (const postId of raiseCandidates) {
      const key = postId.toString();
      const viewCount = viewCounts.get(key) ?? 0;

      if (viewCount > RAISE_THRESHOLD) {
        statesToSave.push(this.transition(postId, stateByPostId, SignalEnum.raised));
        events.push(
          new PostEngagementRaisedEvent({
            postId: key,
            viewCount,
            windowHours: ENGAGEMENT_WINDOW_HOURS,
            raisedAt: now.toISOString(),
          }),
        );
        raisedCount += 1;
        this.logger.info('Engagement raised for post', { postId: key, viewCount });
      }
    }

    for (const raisedState of dropCandidates) {
      const key = raisedState.postId.toString();
      const recentViews = viewCounts.get(key) ?? 0;
      const elapsed = now.getTime() - raisedState.updatedAt.getTime();

      if (elapsed < PROMOTION_MIN_AGE_MS) continue;
      if (recentViews >= DROP_THRESHOLD) continue;

      statesToSave.push(this.transition(raisedState.postId, stateByPostId, SignalEnum.dropped));
      events.push(
        new PostEngagementDroppedEvent({
          postId: key,
          viewCount: recentViews,
          windowHours: ENGAGEMENT_WINDOW_HOURS,
          droppedAt: now.toISOString(),
        }),
      );
      droppedCount += 1;
      this.logger.info('Engagement dropped for post', { postId: key, viewCount: recentViews });
    }

    if (statesToSave.length > 0) {
      await this.engagementStateRepository.saveMany(statesToSave);
      await Promise.all(events.map((event) => this.eventDispatcher.dispatch(event)));
    }

    this.logger.info('Engagement check complete', {
      raisedCount,
      droppedCount,
      durationMs: Date.now() - startedAt,
    });
  }

  private transition(
    postId: PostId,
    stateByPostId: Map<string, EngagementState>,
    signal: SignalEnum,
  ): EngagementState {
    const existing = stateByPostId.get(postId.toString());
    if (existing) {
      existing.update({ lastSignal: new Signal(signal) });
      return existing;
    }
    return EngagementState.create({ postId, lastSignal: new Signal(signal) });
  }
}
