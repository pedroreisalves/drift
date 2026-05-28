import type { Pool } from 'pg';
import { PostId, chunk } from '@drift/shared';
import type AnalyticsLogRepository from '../../domain/analytics-log/repository/analytics-log.repository';
import type { FindPostIdsWithRecentViewsOptions } from '../../domain/analytics-log/repository/analytics-log.repository';
import { EventTypeEnum } from '../../domain/analytics-log/value-object/event-type.value-object';
import type AnalyticsLog from '../../domain/analytics-log/entity/analytics-log.entity';
import { ID_CHUNK_SIZE } from './constants';

interface PostIdRow {
  post_id: string;
}

interface ViewCountRow {
  post_id: string;
  count: string;
}

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
      SELECT DISTINCT al.post_id
      FROM analytics_log al
      LEFT JOIN post_owners po ON al.post_id = po.post_id
      WHERE al.event_type = $1
        AND al.post_id IS NOT NULL
        AND al.timestamp >= $2::timestamptz - make_interval(hours => $3)
        AND (po.owner_client_id IS NULL OR al.client_id != po.owner_client_id)
        ${
          options.excludeDeleted
            ? 'AND NOT EXISTS (SELECT 1 FROM deleted_posts d WHERE d.post_id = al.post_id)'
            : ''
        }
    `;

    const result = await this.pool.query<PostIdRow>(query, [
      EventTypeEnum.PostViewed,
      now,
      windowHours,
    ]);

    return result.rows.map((row) => this.toPostId(row));
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
        SELECT al.post_id, COUNT(*) AS count
        FROM analytics_log al
        LEFT JOIN post_owners po ON al.post_id = po.post_id
        LEFT JOIN post_last_updated plu ON al.post_id = plu.post_id
        WHERE al.event_type = $1
          AND al.post_id = ANY($2::uuid[])
          AND al.timestamp >= GREATEST($3::timestamptz, COALESCE(plu.updated_at, $3::timestamptz))
          AND al.timestamp < $4::timestamptz
          AND (po.owner_client_id IS NULL OR al.client_id != po.owner_client_id)
        GROUP BY al.post_id
      `;

      const result = await this.pool.query<ViewCountRow>(query, [
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

  private toPostId(row: PostIdRow): PostId {
    return new PostId(row.post_id);
  }
}
