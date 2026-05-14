import { uuidv7 } from 'uuidv7';
import TaggingAbandonedEventHandler, {
  type TaggingAbandonedMessage,
} from './tagging-abandoned.event-handler';
import UnlockPostForTaggingHandler from '../../command/unlock-post-for-tagging/unlock-post-for-tagging.handler';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import { type Logger } from '@drift/shared';

describe('TaggingAbandonedEventHandler', () => {
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

  const makeUnlockPostForTaggingHandler = (): UnlockPostForTaggingHandler =>
    new UnlockPostForTaggingHandler(makePostLockRepository(), makeLogger());

  const makeMessage = (postId = uuidv7()): TaggingAbandonedMessage => ({
    eventName: 'TaggingAbandoned',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      taggingProcessId: uuidv7(),
      postId,
      reason: 'LLM timeout after 3 retries',
      retryCount: 3,
      abandonedAt: '2026-01-01T00:00:00.000Z',
    },
  });

  it('should dispatch UnlockPostForTaggingCommand when a TaggingAbandoned event is received', async () => {
    const unlockHandler = makeUnlockPostForTaggingHandler();
    const handler = new TaggingAbandonedEventHandler(unlockHandler, makeLogger());
    const postId = uuidv7();

    const executeSpy = vi.spyOn(unlockHandler, 'execute');

    await handler.handle(makeMessage(postId));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command.postId).toBe(postId);
  });
});
