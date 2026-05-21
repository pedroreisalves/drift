import type { Pool } from 'pg';
import { PostId } from '@drift/shared';
import type AnalyticsLogRepository from '../../domain/analytics-log/repository/analytics-log.repository';
import type { FindPostIdsWithRecentViewsOptions } from '../../domain/analytics-log/repository/analytics-log.repository';
import { EventTypeEnum } from '../../domain/analytics-log/value-object/event-type.value-object';
import type AnalyticsLog from '../../domain/analytics-log/entity/analytics-log.entity';
import { chunk } from '@drift/shared';

const ID_CHUNK_SIZE = 1000;

export default class PostgresAnalyticsLogRepository implements AnalyticsLogRepository {
  constructor(private readonly pool: Pool) {}

  async save(analyticsLog: AnalyticsLog): Promise<void> {
    const query = `
      INSERT INTO analytics_log (id, event_type, post_id, client_id, timestamp)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await this.pool.query(query, [
      analyticsLog.id.toString(),
      analyticsLog.eventType.toString(),
      analyticsLog.postId?.toString() ?? null,
      analyticsLog.clientId.toString(),
      analyticsLog.timestamp,
    ]);
  }

  async findPostIdsWithRecentViews(
    windowHours: number,
    options: FindPostIdsWithRecentViewsOptions = {},
  ): Promise<PostId[]> {
    const now = options.now ?? new Date();

    const query = `
      SELECT DISTINCT post_id
      FROM analytics_log
      WHERE event_type = $1
        AND post_id IS NOT NULL
        AND timestamp >= $2::timestamptz - make_interval(hours => $3)
        ${
          options.excludeDeleted
            ? 'AND NOT EXISTS (SELECT 1 FROM deleted_posts d WHERE d.post_id = analytics_log.post_id)'
            : ''
        }
    `;

    const result = await this.pool.query<{ post_id: string }>(query, [
      EventTypeEnum.PostViewed,
      now,
      windowHours,
    ]);

    return result.rows.map((row) => new PostId(row.post_id));
  }

  async countViewsInRangeBatch(
    postIds: PostId[],
    from: Date,
    to: Date,
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (postIds.length === 0) return counts;

    const ids = postIds.map((id) => id.toString());

    for (const idChunk of chunk(ids, ID_CHUNK_SIZE)) {
      const query = `
        SELECT post_id, COUNT(*) AS count
        FROM analytics_log
        WHERE event_type = $1
          AND post_id = ANY($2::uuid[])
          AND timestamp >= $3::timestamptz
          AND timestamp < $4::timestamptz
        GROUP BY post_id
      `;

      const result = await this.pool.query<{ post_id: string; count: string }>(query, [
        EventTypeEnum.PostViewed,
        idChunk,
        from,
        to,
      ]);

      for (const row of result.rows) {
        counts.set(row.post_id, parseInt(row.count, 10));
      }
    }

    return counts;
  }
}
