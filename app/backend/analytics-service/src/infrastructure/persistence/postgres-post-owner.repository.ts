import type { Pool } from 'pg';
import type { PostId, ClientId } from '@drift/shared';
import type PostOwnerRepository from '../../domain/analytics-log/repository/post-owner.repository';

export default class PostgresPostOwnerRepository implements PostOwnerRepository {
  constructor(private readonly pool: Pool) {}

  async save(postId: PostId, ownerClientId: ClientId): Promise<void> {
    const query = `
      INSERT INTO post_owners (post_id, owner_client_id)
      VALUES ($1, $2)
      ON CONFLICT (post_id) DO NOTHING
    `;

    await this.pool.query(query, [postId.toString(), ownerClientId.toString()]);
  }
}
