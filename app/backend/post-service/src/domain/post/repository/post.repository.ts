import type Post from '../entity/post.aggregate';
import type { PostId } from '@drift/shared';

export default interface PostRepository {
  save(post: Post): Promise<void>;
  delete(postId: PostId): Promise<void>;
  findById(postId: PostId): Promise<Post | null>;
  findAll(options?: { limit: number; offset: number }): Promise<Post[]>;
  findAllFeatured(): Promise<Post[]>;
}
