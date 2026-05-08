import type { Pool } from 'pg';
import Post from '../../domain/post/entity/post.aggregate';
import PostId from '../../domain/post/value-object/post-id.value-object';
import ClientId from '../../domain/post/value-object/client-id.value-object';
import type PostRepository from '../../domain/post/repository/post.repository';

interface PostRow {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  body: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export default class PostgresPostRepository implements PostRepository {
  constructor(private readonly pool: Pool) {}

  async save(post: Post): Promise<void> {
    const query = `
      INSERT INTO posts (id, client_id, client_name, title, body, tags, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        tags = EXCLUDED.tags,
        updated_at = EXCLUDED.updated_at
    `;

    await this.pool.query(query, [
      post.id.toString(),
      post.clientId.toString(),
      post.clientName,
      post.title,
      post.body,
      post.tags,
      post.createdAt,
      post.updatedAt,
    ]);
  }

  async delete(postId: PostId): Promise<void> {
    await this.pool.query('DELETE FROM posts WHERE id = $1', [postId.toString()]);
  }

  async findById(postId: PostId): Promise<Post | null> {
    const result = await this.pool.query<PostRow>('SELECT * FROM posts WHERE id = $1', [
      postId.toString(),
    ]);

    if (result.rows.length === 0) return null;

    return this.toDomain(result.rows[0]);
  }

  async findAll(options?: { limit: number; offset: number }): Promise<Post[]> {
    let query = 'SELECT * FROM posts ORDER BY created_at DESC';
    const params: unknown[] = [];

    if (options) {
      query += ' LIMIT $1 OFFSET $2';
      params.push(options.limit, options.offset);
    }

    const result = await this.pool.query<PostRow>(query, params);

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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
