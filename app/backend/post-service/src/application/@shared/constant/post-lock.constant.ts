export const POST_LOCK_TYPE = {
  TAGGING: 'tagging',
} as const;

export type PostLockType = (typeof POST_LOCK_TYPE)[keyof typeof POST_LOCK_TYPE];
