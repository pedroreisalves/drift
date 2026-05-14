import { uuidv7 } from 'uuidv7';
import LockPostForTaggingHandler from './lock-post-for-tagging.handler';
import LockPostForTaggingCommand from './lock-post-for-tagging.command';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import { type Logger } from '@drift/shared';

describe('LockPostForTaggingHandler', () => {
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
    const handler = new LockPostForTaggingHandler(postLockRepository, makeLogger());
    const postId = uuidv7();

    await handler.execute(new LockPostForTaggingCommand(postId));

    expect(postLockRepository.lock).toHaveBeenCalledWith(postId, 'tagging');
  });
});
