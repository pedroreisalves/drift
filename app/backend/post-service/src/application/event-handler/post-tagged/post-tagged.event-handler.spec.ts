import { uuidv7 } from 'uuidv7';
import PostTaggedEventHandler, { type PostTaggedMessage } from './post-tagged.event-handler';
import UpdatePostTagsHandler from '../../command/update-post-tags/update-post-tags.handler';
import UpdatePostTagsCommand from '../../command/update-post-tags/update-post-tags.command';
import UnlockPostForTaggingHandler from '../../command/unlock-post-for-tagging/unlock-post-for-tagging.handler';
import { type Logger } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import { type EventDispatcher } from '@drift/shared';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

type MessageOverrides = Partial<Pick<PostTaggedMessage['payload'], 'postId' | 'tags'>>;

describe('PostTaggedEventHandler', () => {
  const makeRepository = (): PostRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
  });

  const makeDispatcher = (): EventDispatcher => ({
    dispatch: vi.fn().mockResolvedValue(undefined),
  });

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

  const makeUpdatePostTagsHandler = (): UpdatePostTagsHandler =>
    new UpdatePostTagsHandler(makeRepository(), makeDispatcher(), makeLogger());

  const makeUnlockPostForTaggingHandler = (): UnlockPostForTaggingHandler =>
    new UnlockPostForTaggingHandler(makePostLockRepository(), makeLogger());

  const makeMessage = (overrides: MessageOverrides = {}): PostTaggedMessage => ({
    eventName: 'PostTagged',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      taggingProcessId: uuidv7(),
      postId: overrides.postId ?? uuidv7(),
      tags: overrides.tags ?? ['tech', 'news'],
      taggedAt: '2026-01-01T00:00:00.000Z',
    },
  });

  it('should invoke UpdatePostTagsHandler.execute with a command built from the message payload', async () => {
    const updatePostTagsHandler = makeUpdatePostTagsHandler();
    const eventHandler = new PostTaggedEventHandler(
      updatePostTagsHandler,
      makeUnlockPostForTaggingHandler(),
      makeLogger(),
    );
    const postId = uuidv7();
    const tags = ['tech', 'news', 'sports'];

    const executeSpy = vi.spyOn(updatePostTagsHandler, 'execute').mockResolvedValue(undefined);

    await eventHandler.handle(makeMessage({ postId, tags }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(UpdatePostTagsCommand);
    expect(command.postId).toBe(postId);
    expect(command.tags).toEqual(tags);
  });

  it('should unlock the post after successfully applying tags', async () => {
    const updatePostTagsHandler = makeUpdatePostTagsHandler();
    const unlockHandler = makeUnlockPostForTaggingHandler();
    const postId = uuidv7();

    vi.spyOn(updatePostTagsHandler, 'execute').mockResolvedValue(undefined);
    const unlockSpy = vi.spyOn(unlockHandler, 'execute');

    const eventHandler = new PostTaggedEventHandler(
      updatePostTagsHandler,
      unlockHandler,
      makeLogger(),
    );

    await eventHandler.handle(makeMessage({ postId }));

    expect(unlockSpy).toHaveBeenCalledTimes(1);
    const command = unlockSpy.mock.calls[0][0];
    expect(command.postId).toBe(postId);
  });

  it('should unlock the post and skip applying tags when the post no longer exists', async () => {
    const updatePostTagsHandler = makeUpdatePostTagsHandler();
    const unlockHandler = makeUnlockPostForTaggingHandler();
    const postId = uuidv7();

    const updateSpy = vi
      .spyOn(updatePostTagsHandler, 'execute')
      .mockRejectedValue(new PostNotFoundError(postId));
    const unlockSpy = vi.spyOn(unlockHandler, 'execute');

    const eventHandler = new PostTaggedEventHandler(
      updatePostTagsHandler,
      unlockHandler,
      makeLogger(),
    );

    await eventHandler.handle(makeMessage({ postId }));

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(unlockSpy).toHaveBeenCalledTimes(1);
    const command = unlockSpy.mock.calls[0][0];
    expect(command.postId).toBe(postId);
  });

  it('should rethrow unexpected errors without unlocking', async () => {
    const updatePostTagsHandler = makeUpdatePostTagsHandler();
    const unlockHandler = makeUnlockPostForTaggingHandler();
    const unexpectedError = new Error('db connection lost');

    vi.spyOn(updatePostTagsHandler, 'execute').mockRejectedValue(unexpectedError);
    const unlockSpy = vi.spyOn(unlockHandler, 'execute');

    const eventHandler = new PostTaggedEventHandler(
      updatePostTagsHandler,
      unlockHandler,
      makeLogger(),
    );

    await expect(eventHandler.handle(makeMessage())).rejects.toThrow(unexpectedError);
    expect(unlockSpy).not.toHaveBeenCalled();
  });
});
