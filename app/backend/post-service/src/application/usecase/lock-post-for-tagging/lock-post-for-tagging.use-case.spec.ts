import { uuidv7 } from 'uuidv7';
import LockPostForTaggingUseCase from './lock-post-for-tagging.use-case';
import type PostLockRepository from '../../../domain/post/repository/post-lock.repository';
import { POST_LOCK_TYPE } from '../../../domain/post/repository/post-lock.repository';
import { PostId, type Logger } from '@drift/shared';

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

describe('LockPostForTaggingUseCase', () => {
  let postLockRepository: PostLockRepository;
  let useCase: LockPostForTaggingUseCase;

  beforeEach(() => {
    postLockRepository = makePostLockRepository();
    useCase = new LockPostForTaggingUseCase(postLockRepository, makeLogger());
  });

  it('should lock the post with POST_LOCK_TYPE.TAGGING', async () => {
    const postId = uuidv7();
    const lockSpy = vi.spyOn(postLockRepository, 'lock');

    await useCase.execute({ postId });

    expect(lockSpy).toHaveBeenCalledTimes(1);
    expect(lockSpy).toHaveBeenCalledWith(expect.any(PostId), POST_LOCK_TYPE.TAGGING);
  });

  it('should call repository.lock before returning', async () => {
    const postId = uuidv7();
    const callOrder: string[] = [];

    vi.spyOn(postLockRepository, 'lock').mockImplementation(() => {
      callOrder.push('repository.lock');
      return Promise.resolve();
    });

    await useCase.execute({ postId });

    expect(callOrder).toEqual(['repository.lock']);
  });
});
