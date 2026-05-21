import type { PostId } from '@drift/shared';

export default interface DeletedPostRepository {
  save: (postId: PostId, deletedAt: Date) => Promise<void>;
}
