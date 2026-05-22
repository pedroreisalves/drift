import type { PostId } from '@drift/shared';

export const POST_LOCK_TYPE = {
  TAGGING: 'tagging',
} as const;

export type PostLockType = (typeof POST_LOCK_TYPE)[keyof typeof POST_LOCK_TYPE];

export default interface PostLockRepository {
  lock(postId: PostId, lockType: PostLockType): Promise<void>;
  unlock(postId: PostId, lockType: PostLockType): Promise<void>;
  isLocked(postId: PostId, lockType: PostLockType): Promise<boolean>;
}
