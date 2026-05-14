import { uuidv7 } from 'uuidv7';
import UnlockPostForTaggingHandler from './unlock-post-for-tagging.handler';
import UnlockPostForTaggingCommand from './unlock-post-for-tagging.command';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import { type Logger } from '@drift/shared';

describe('UnlockPostForTaggingHandler', () => {
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

  it('should unlock the post after tagging', async () => {
    const postLockRepository = makePostLockRepository();
    const handler = new UnlockPostForTaggingHandler(postLockRepository, makeLogger());
    const postId = uuidv7();

    await handler.execute(new UnlockPostForTaggingCommand(postId));

    expect(postLockRepository.unlock).toHaveBeenCalledWith(postId, 'tagging');
  });
});
