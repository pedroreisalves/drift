import type { Pool } from 'pg';
import type TaggingProcessRepository from '../../domain/tagging-process/repository/tagging-process.repository';
import TaggingProcess from '../../domain/tagging-process/entity/tagging-process.aggregate';
import { PostId } from '@drift/shared';
import TaggingProcessId from '../../domain/tagging-process/value-object/tagging-process-id.value-object';
import type { TaggingStatusEnum } from '../../domain/tagging-process/value-object/tagging-status.value-object';
import TaggingStatus from '../../domain/tagging-process/value-object/tagging-status.value-object';

interface TaggingProcessRow {
  id: string;
  post_id: string;
  retry_count: number;
  title: string;
  body: string;
  status: TaggingStatusEnum;
  reason: string | null;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export default class PostgresTaggingProcessRepository implements TaggingProcessRepository {
  constructor(private readonly pool: Pool) {}

  async findByPostId(postId: PostId): Promise<TaggingProcess | null> {
    const result = await this.pool.query<TaggingProcessRow>(
      'SELECT * FROM tagging_process WHERE post_id = $1 ORDER BY created_at DESC',
      [postId.toString()],
    );

    if (result.rows.length === 0) return null;

    return this.toDomain(result.rows[0]);
  }

  async findById(taggingPostId: TaggingProcessId): Promise<TaggingProcess | null> {
    const result = await this.pool.query<TaggingProcessRow>(
      'SELECT * FROM tagging_process WHERE id = $1',
      [taggingPostId.toString()],
    );

    if (result.rows.length === 0) return null;

    return this.toDomain(result.rows[0]);
  }

  async save(taggingProcess: TaggingProcess): Promise<void> {
    const query = `
      INSERT INTO tagging_process (id, post_id, retry_count, title, body, status, reason, tags, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        retry_count = EXCLUDED.retry_count,
        status = EXCLUDED.status,
        reason = EXCLUDED.reason,
        tags = EXCLUDED.tags,
        updated_at = EXCLUDED.updated_at
    `;

    await this.pool.query(query, [
      taggingProcess.id.toString(),
      taggingProcess.postId.toString(),
      taggingProcess.retryCount,
      taggingProcess.title,
      taggingProcess.body,
      taggingProcess.status.toString(),
      taggingProcess.reason,
      taggingProcess.tags,
      taggingProcess.createdAt,
      taggingProcess.updatedAt,
    ]);
  }

  private toDomain(row: TaggingProcessRow): TaggingProcess {
    return TaggingProcess.reconstruct({
      id: new TaggingProcessId(row.id),
      postId: new PostId(row.post_id),
      retryCount: row.retry_count,
      title: row.title,
      body: row.body,
      status: new TaggingStatus(row.status),
      reason: row.reason,
      tags: row.tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
