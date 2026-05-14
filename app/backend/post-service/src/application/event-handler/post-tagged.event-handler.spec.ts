import { uuidv7 } from 'uuidv7';
import PostTaggedEventHandler, { type PostTaggedMessage } from './post-tagged.event-handler';
import type UpdatePostTagsHandler from '../command/update-post-tags/update-post-tags.handler';
import UpdatePostTagsCommand from '../command/update-post-tags/update-post-tags.command';
import type Logger from '../@shared/interface/logger.interface';
import type PostRepository from '../../domain/post/repository/post.repository';
import type PostLockRepository from '../@shared/interface/post-lock.repository';
import type Post from '../../domain/post/entity/post.aggregate';

type MessageOverrides = Partial<Pick<PostTaggedMessage['payload'], 'postId' | 'tags'>>;

describe('PostTaggedEventHandler', () => {
  const makeUpdatePostTagsHandler = (): UpdatePostTagsHandler =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as UpdatePostTagsHandler;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makePost = (): Post => ({}) as unknown as Post;

  const makePostRepository = (post: Post | null): PostRepository =>
    ({
      findById: vi.fn().mockResolvedValue(post),
    }) as unknown as PostRepository;

  const makePostLockRepository = (): PostLockRepository => ({
    lock: vi.fn().mockResolvedValue(undefined),
    unlock: vi.fn().mockResolvedValue(undefined),
    isLocked: vi.fn().mockResolvedValue(false),
  });

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
    const postLockRepository = makePostLockRepository();
    const eventHandler = new PostTaggedEventHandler(
      updatePostTagsHandler,
      makePostRepository(makePost()),
      postLockRepository,
      makeLogger(),
    );
    const postId = uuidv7();
    const tags = ['tech', 'news', 'sports'];

    const executeSpy = vi.spyOn(updatePostTagsHandler, 'execute');

    await eventHandler.handle(makeMessage({ postId, tags }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(UpdatePostTagsCommand);
    expect(command.postId).toBe(postId);
    expect(command.tags).toEqual(tags);
  });

  it('should unlock the post after successfully applying tags', async () => {
    const postLockRepository = makePostLockRepository();
    const postId = uuidv7();
    const eventHandler = new PostTaggedEventHandler(
      makeUpdatePostTagsHandler(),
      makePostRepository(makePost()),
      postLockRepository,
      makeLogger(),
    );

    await eventHandler.handle(makeMessage({ postId }));

    expect(postLockRepository.unlock).toHaveBeenCalledWith(postId, 'tagging');
  });

  it('should unlock the post and skip applying tags when the post no longer exists', async () => {
    const updatePostTagsHandler = makeUpdatePostTagsHandler();
    const postLockRepository = makePostLockRepository();
    const postId = uuidv7();
    const eventHandler = new PostTaggedEventHandler(
      updatePostTagsHandler,
      makePostRepository(null),
      postLockRepository,
      makeLogger(),
    );

    const executeSpy = vi.spyOn(updatePostTagsHandler, 'execute');

    await eventHandler.handle(makeMessage({ postId }));

    expect(executeSpy).not.toHaveBeenCalled();
    expect(postLockRepository.unlock).toHaveBeenCalledWith(postId, 'tagging');
  });
});
