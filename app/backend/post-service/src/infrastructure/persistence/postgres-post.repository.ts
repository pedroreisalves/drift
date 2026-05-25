import type { Pool } from 'pg';
import Post from '../../domain/post/entity/post.aggregate';
import { PostId, ClientId } from '@drift/shared';
import type PostRepository from '../../domain/post/repository/post.repository';

interface PostRow {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  body: string;
  tags: string[];
  is_featured: boolean;
  featured_at: Date | null;
  engagement_drop_flagged: boolean;
  is_tagging_in_progress: boolean;
  created_at: Date;
  updated_at: Date;
}

const POST_COLUMNS =
  'posts.id, posts.client_id, posts.client_name, posts.title, posts.body, posts.tags, posts.is_featured, posts.featured_at, posts.engagement_drop_flagged, posts.created_at, posts.updated_at';

const TAGGING_LOCK_JOIN =
  "LEFT JOIN post_locks ON posts.id = post_locks.post_id AND post_locks.lock_type = 'tagging'";

const TAGGING_LOCK_COLUMN = '(post_locks.post_id IS NOT NULL) AS is_tagging_in_progress';

export default class PostgresPostRepository implements PostRepository {
  constructor(private readonly pool: Pool) {}

  async save(post: Post): Promise<void> {
    const query = `
      INSERT INTO posts (id, client_id, client_name, title, body, tags, is_featured, featured_at, engagement_drop_flagged, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        tags = EXCLUDED.tags,
        is_featured = EXCLUDED.is_featured,
        featured_at = EXCLUDED.featured_at,
        engagement_drop_flagged = EXCLUDED.engagement_drop_flagged,
        updated_at = EXCLUDED.updated_at
    `;

    await this.pool.query(query, [
      post.id.toString(),
      post.clientId.toString(),
      post.clientName,
      post.title,
      post.body,
      post.tags,
      post.isFeatured,
      post.featuredAt,
      post.engagementDropFlagged,
      post.createdAt,
      post.updatedAt,
    ]);
  }

  async delete(postId: PostId): Promise<void> {
    await this.pool.query('DELETE FROM posts WHERE id = $1', [postId.toString()]);
  }

  async findById(postId: PostId): Promise<Post | null> {
    const result = await this.pool.query<PostRow>(
      `SELECT ${POST_COLUMNS}, ${TAGGING_LOCK_COLUMN} FROM posts ${TAGGING_LOCK_JOIN} WHERE posts.id = $1`,
      [postId.toString()],
    );

    if (result.rows.length === 0) return null;

    return this.toDomain(result.rows[0]);
  }

  async findAll(options?: { limit: number; offset: number; featured?: boolean }): Promise<Post[]> {
    const params: unknown[] = [];
    let query = `SELECT ${POST_COLUMNS}, ${TAGGING_LOCK_COLUMN} FROM posts ${TAGGING_LOCK_JOIN}`;

    if (options?.featured !== undefined) {
      params.push(options.featured);
      query += ` WHERE posts.is_featured = $${params.length}`;
    }

    query += ' ORDER BY posts.created_at DESC';

    if (options) {
      params.push(options.limit, options.offset);
      const len = params.length;
      query += ` LIMIT $${len - 1} OFFSET $${len}`;
    }

    const result = await this.pool.query<PostRow>(query, params);

    return result.rows.map((row) => this.toDomain(row));
  }

  async findAllFeatured(): Promise<Post[]> {
    const result = await this.pool.query<PostRow>(
      `SELECT ${POST_COLUMNS}, ${TAGGING_LOCK_COLUMN} FROM posts ${TAGGING_LOCK_JOIN} WHERE posts.is_featured = TRUE`,
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: PostRow): Post {
    return Post.reconstruct({
      id: new PostId(row.id),
      clientId: new ClientId(row.client_id),
      clientName: row.client_name,
      title: row.title,
      body: row.body,
      tags: row.tags,
      isFeatured: row.is_featured,
      featuredAt: row.featured_at,
      engagementDropFlagged: row.engagement_drop_flagged,
      isTaggingInProgress: row.is_tagging_in_progress,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
