import type { PostId } from '@drift/shared';
import type { Pool } from 'pg';

import type DeletedPostRepository from '../../domain/analytics-log/repository/deleted-post.repository';

export default class PostgresDeletedPostRepository implements DeletedPostRepository {
  constructor(private readonly pool: Pool) {}

  async save(postId: PostId, deletedAt: Date): Promise<void> {
    const query = `
      INSERT INTO deleted_posts (post_id, deleted_at)
      VALUES ($1, $2)
      ON CONFLICT (post_id) DO NOTHING
    `;

    await this.pool.query(query, [postId.toString(), deletedAt]);
  }
}
