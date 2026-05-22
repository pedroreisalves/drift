import type { PostLockType } from '../../../application/@shared/constant/post-lock.constant';

export default interface PostLockRepository {
  lock(postId: string, lockType: PostLockType): Promise<void>;
  unlock(postId: string, lockType: PostLockType): Promise<void>;
  isLocked(postId: string, lockType: PostLockType): Promise<boolean>;
}
