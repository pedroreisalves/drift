import { uuidv7 } from 'uuidv7';
import LockPostForTaggingUseCase from './lock-post-for-tagging.use-case';
import type PostLockRepository from '../../../domain/post/repository/post-lock.repository';
import { POST_LOCK_TYPE } from '../../@shared/constant/post-lock.constant';
import { type Logger } from '@drift/shared';

describe('LockPostForTaggingUseCase', () => {
  const makePostLockRepository = (): PostLockRepository => ({
    lock: vi.fn().mockResolvedValue(undefined),
    unlock: vi.fn().mockResolvedValue(undefined),
    isLocked: vi.fn().mockResolvedValue(false),
  });

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  it('should lock the post for tagging', async () => {
    const postLockRepository = makePostLockRepository();
    const useCase = new LockPostForTaggingUseCase(postLockRepository, makeLogger());
    const postId = uuidv7();

    await useCase.execute({ postId });

    expect(postLockRepository.lock).toHaveBeenCalledWith(postId, POST_LOCK_TYPE.TAGGING);
  });
});
