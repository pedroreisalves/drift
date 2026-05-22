import type { Pool } from 'pg';
import type { PostId } from '@drift/shared';
import type PostLockRepository from '../../domain/post/repository/post-lock.repository';
import type { PostLockType } from '../../domain/post/repository/post-lock.repository';

interface PostLockExistsRow {
  exists: boolean;
}

export default class PostgresPostLockRepository implements PostLockRepository {
  constructor(private readonly pool: Pool) {}

  async lock(postId: PostId, lockType: PostLockType): Promise<void> {
    await this.pool.query(
      'INSERT INTO post_locks (post_id, lock_type) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId.toString(), lockType],
    );
  }

  async unlock(postId: PostId, lockType: PostLockType): Promise<void> {
    await this.pool.query('DELETE FROM post_locks WHERE post_id = $1 AND lock_type = $2', [
      postId.toString(),
      lockType,
    ]);
  }

  async isLocked(postId: PostId, lockType: PostLockType): Promise<boolean> {
    const result = await this.pool.query<PostLockExistsRow>(
      'SELECT EXISTS(SELECT 1 FROM post_locks WHERE post_id = $1 AND lock_type = $2)',
      [postId.toString(), lockType],
    );
    return result.rows[0].exists;
  }
}
