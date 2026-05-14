import { uuidv7 } from 'uuidv7';
import TaggingInitializedEventHandler, {
  type TaggingInitializedMessage,
} from './tagging-initialized.event-handler';
import LockPostForTaggingHandler from '../../command/lock-post-for-tagging/lock-post-for-tagging.handler';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import { type Logger } from '@drift/shared';

describe('TaggingInitializedEventHandler', () => {
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

  const makeLockPostForTaggingHandler = (): LockPostForTaggingHandler =>
    new LockPostForTaggingHandler(makePostLockRepository(), makeLogger());

  const makeMessage = (postId = uuidv7()): TaggingInitializedMessage => ({
    eventName: 'TaggingInitialized',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      taggingProcessId: uuidv7(),
      postId,
      retryCount: 0,
      initializedAt: '2026-01-01T00:00:00.000Z',
    },
  });

  it('should dispatch LockPostForTaggingCommand when a TaggingInitialized event is received', async () => {
    const lockHandler = makeLockPostForTaggingHandler();
    const handler = new TaggingInitializedEventHandler(lockHandler, makeLogger());
    const postId = uuidv7();

    const executeSpy = vi.spyOn(lockHandler, 'execute');

    await handler.handle(makeMessage(postId));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command.postId).toBe(postId);
  });
});
