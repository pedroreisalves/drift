import type Post from '../entity/post.aggregate';
import type PostId from '../value-object/post-id.value-object';

export default interface PostRepository {
  save: (post: Post) => Promise<void>;
  delete: (postId: PostId) => Promise<void>;
  findById: (postId: PostId) => Promise<Post | null>;
  findAll: (options?: { limit: number; offset: number }) => Promise<Post[]>;
}
