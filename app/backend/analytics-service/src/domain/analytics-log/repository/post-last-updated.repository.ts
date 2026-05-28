import type { PostId } from '@drift/shared';

export default interface PostLastUpdatedRepository {
  save(postId: PostId, updatedAt: Date): Promise<void>;
}
