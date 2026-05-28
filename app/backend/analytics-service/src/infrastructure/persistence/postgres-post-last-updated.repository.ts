import type { Pool } from 'pg';
import type { PostId } from '@drift/shared';
import type PostLastUpdatedRepository from '../../domain/analytics-log/repository/post-last-updated.repository';

export default class PostgresPostLastUpdatedRepository implements PostLastUpdatedRepository {
  constructor(private readonly pool: Pool) {}

  async save(postId: PostId, updatedAt: Date): Promise<void> {
    const query = `
      INSERT INTO post_last_updated (post_id, updated_at)
      VALUES ($1, $2)
      ON CONFLICT (post_id) DO UPDATE SET
        updated_at = EXCLUDED.updated_at
      WHERE post_last_updated.updated_at < EXCLUDED.updated_at
    `;

    await this.pool.query(query, [postId.toString(), updatedAt]);
  }
}
