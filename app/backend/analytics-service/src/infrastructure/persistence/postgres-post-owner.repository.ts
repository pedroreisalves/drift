import type { ClientHash, PostId } from '@drift/shared';
import type { Pool } from 'pg';

import type PostOwnerRepository from '../../domain/analytics-log/repository/post-owner.repository';

export default class PostgresPostOwnerRepository implements PostOwnerRepository {
  constructor(private readonly pool: Pool) {}

  async save(postId: PostId, ownerClientHash: ClientHash): Promise<void> {
    const query = `
      INSERT INTO post_owners (post_id, owner_client_hash)
      VALUES ($1, $2)
      ON CONFLICT (post_id) DO NOTHING
    `;

    await this.pool.query(query, [postId.toString(), ownerClientHash.toString()]);
  }
}
