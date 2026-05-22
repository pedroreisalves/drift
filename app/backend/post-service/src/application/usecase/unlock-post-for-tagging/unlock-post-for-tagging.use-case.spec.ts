import { uuidv7 } from 'uuidv7';
import UnlockPostForTaggingUseCase from './unlock-post-for-tagging.use-case';
import type PostLockRepository from '../../../domain/post/repository/post-lock.repository';
import { POST_LOCK_TYPE } from '../../@shared/constant/post-lock.constant';
import { type Logger } from '@drift/shared';

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

describe('UnlockPostForTaggingUseCase', () => {
  let postLockRepository: PostLockRepository;
  let useCase: UnlockPostForTaggingUseCase;

  beforeEach(() => {
    postLockRepository = makePostLockRepository();
    useCase = new UnlockPostForTaggingUseCase(postLockRepository, makeLogger());
  });

  it('should unlock the post with POST_LOCK_TYPE.TAGGING', async () => {
    const postId = uuidv7();
    const unlockSpy = vi.spyOn(postLockRepository, 'unlock');

    await useCase.execute({ postId });

    expect(unlockSpy).toHaveBeenCalledTimes(1);
    expect(unlockSpy).toHaveBeenCalledWith(postId, POST_LOCK_TYPE.TAGGING);
  });

  it('should call repository.unlock before returning', async () => {
    const postId = uuidv7();
    const callOrder: string[] = [];

    vi.spyOn(postLockRepository, 'unlock').mockImplementation(() => {
      callOrder.push('repository.unlock');
      return Promise.resolve();
    });

    await useCase.execute({ postId });

    expect(callOrder).toEqual(['repository.unlock']);
  });

});
