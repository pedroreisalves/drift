import type { Pool, PoolClient } from 'pg';
import { PostId } from '@drift/shared';
import EngagementState from '../../domain/analytics-log/entity/engagement-state.entity';
import type EngagementStateRepository from '../../domain/analytics-log/repository/engagement-state.repository';
import type { FindAllRaisedOptions } from '../../domain/analytics-log/repository/engagement-state.repository';
import Signal, { SignalEnum } from '../../domain/analytics-log/value-object/signal.value-object';
import { chunk } from '@drift/shared';

interface EngagementStateRow {
  post_id: string;
  last_signal: string;
  updated_at: Date;
}

const ID_CHUNK_SIZE = 1000;

export default class PostgresEngagementStateRepository implements EngagementStateRepository {
  constructor(private readonly pool: Pool) {}

  async saveMany(states: EngagementState[]): Promise<void> {
    if (states.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const stateChunk of chunk(states, ID_CHUNK_SIZE)) {
        await this.upsertChunk(client, stateChunk);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async upsertChunk(client: PoolClient, states: EngagementState[]): Promise<void> {
    const values: string[] = [];
    const params: unknown[] = [];

    states.forEach((state, index) => {
      const offset = index * 3;
      values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
      params.push(state.postId.toString(), state.lastSignal.toString(), state.updatedAt);
    });

    const query = `
      INSERT INTO engagement_state (post_id, last_signal, updated_at)
      VALUES ${values.join(', ')}
      ON CONFLICT (post_id) DO UPDATE SET
        last_signal = EXCLUDED.last_signal,
        updated_at = EXCLUDED.updated_at
    `;

    await client.query(query, params);
  }

  async findByPostIds(postIds: PostId[]): Promise<EngagementState[]> {
    if (postIds.length === 0) return [];

    const ids = postIds.map((id) => id.toString());
    const states: EngagementState[] = [];

    for (const idChunk of chunk(ids, ID_CHUNK_SIZE)) {
      const result = await this.pool.query<EngagementStateRow>(
        'SELECT post_id, last_signal, updated_at FROM engagement_state WHERE post_id = ANY($1::uuid[])',
        [idChunk],
      );
      states.push(...result.rows.map((row) => this.toDomain(row)));
    }

    return states;
  }

  async findAllRaised(options: FindAllRaisedOptions = {}): Promise<EngagementState[]> {
    const query = `
      SELECT post_id, last_signal, updated_at
      FROM engagement_state
      WHERE last_signal = $1
        ${
          options.excludeDeleted
            ? 'AND NOT EXISTS (SELECT 1 FROM deleted_posts d WHERE d.post_id = engagement_state.post_id)'
            : ''
        }
    `;

    const result = await this.pool.query<EngagementStateRow>(query, [SignalEnum.raised]);

    return result.rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: EngagementStateRow): EngagementState {
    const state = EngagementState.reconstruct({
      postId: new PostId(row.post_id),
      lastSignal: new Signal(row.last_signal as SignalEnum),
      updatedAt: row.updated_at,
    });

    return state;
  }
}
