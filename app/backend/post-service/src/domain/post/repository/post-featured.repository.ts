import type { PostId } from '@drift/shared';

export default interface PostFeaturedRepository {
  save(postId: PostId): Promise<void>;
  delete(postId: PostId): Promise<void>;
}
