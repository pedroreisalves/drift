import type { PostId } from '@drift/shared';
import type AnalyticsLog from '../entity/analytics-log.entity';

export interface FindPostIdsWithRecentViewsOptions {
  excludeDeleted?: boolean;
  now?: Date;
}

export default interface AnalyticsLogRepository {
  save(analyticsLog: AnalyticsLog): Promise<void>;
  findPostIdsWithRecentViews(
    windowHours: number,
    options?: FindPostIdsWithRecentViewsOptions,
  ): Promise<PostId[]>;
  countViewsInRangeBatch(postIds: PostId[], from: Date, to: Date): Promise<Map<string, number>>;
}
