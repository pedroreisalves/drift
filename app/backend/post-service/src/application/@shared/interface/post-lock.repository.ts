export default interface PostLockRepository {
  lock: (postId: string, lockType: string) => Promise<void>;
  unlock: (postId: string, lockType: string) => Promise<void>;
  isLocked: (postId: string, lockType: string) => Promise<boolean>;
}
