import type { Pool } from 'pg';
import type { PostId } from '@drift/shared';
import type PostFeaturedRepository from '../../domain/post/repository/post-featured.repository';

export default class PostgresPostFeaturedRepository implements PostFeaturedRepository {
  constructor(private readonly pool: Pool) {}

  async save(postId: PostId): Promise<void> {
    await this.pool.query(
      'INSERT INTO post_featured (post_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [postId.toString()],
    );
  }

  async delete(postId: PostId): Promise<void> {
    await this.pool.query('DELETE FROM post_featured WHERE post_id = $1', [postId.toString()]);
  }
}
