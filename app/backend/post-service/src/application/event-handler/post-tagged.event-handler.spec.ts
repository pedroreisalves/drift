import { uuidv7 } from 'uuidv7';
import PostTaggedEventHandler, { type PostTaggedMessage } from './post-tagged.event-handler';
import type UpdatePostTagsHandler from '../command/update-post-tags/update-post-tags.handler';
import UpdatePostTagsCommand from '../command/update-post-tags/update-post-tags.command';
import type Logger from '../@shared/interface/logger.interface';
import type PostRepository from '../../domain/post/repository/post.repository';
import type Post from '../../domain/post/entity/post.aggregate';

type MessageOverrides = Partial<
  Pick<PostTaggedMessage['payload'], 'postId' | 'tags' | 'postUpdatedAt'>
>;

describe('PostTaggedEventHandler', () => {
  const postUpdatedAt = '2026-01-01T00:00:00.000Z';

  const makeUpdatePostTagsHandler = (): UpdatePostTagsHandler =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as UpdatePostTagsHandler;

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makePost = (updatedAt: string): Post =>
    ({
      updatedAt: new Date(updatedAt),
    }) as unknown as Post;

  const makePostRepository = (post: Post | null): PostRepository =>
    ({
      findById: vi.fn().mockResolvedValue(post),
    }) as unknown as PostRepository;

  const makeMessage = (overrides: MessageOverrides = {}): PostTaggedMessage => ({
    eventName: 'PostTagged',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      taggingProcessId: uuidv7(),
      postId: overrides.postId ?? uuidv7(),
      tags: overrides.tags ?? ['tech', 'news'],
      taggedAt: '2026-01-01T00:00:00.000Z',
      postUpdatedAt: overrides.postUpdatedAt ?? postUpdatedAt,
    },
  });

  it('should invoke UpdatePostTagsHandler.execute with a command built from the message payload', async () => {
    const updatePostTagsHandler = makeUpdatePostTagsHandler();
    const postRepository = makePostRepository(makePost(postUpdatedAt));
    const eventHandler = new PostTaggedEventHandler(
      updatePostTagsHandler,
      postRepository,
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

  it('should skip applying tags when postUpdatedAt does not match the post current updatedAt', async () => {
    const updatePostTagsHandler = makeUpdatePostTagsHandler();
    const logger = makeLogger();
    const postRepository = makePostRepository(makePost('2026-05-08T12:00:00.000Z'));
    const eventHandler = new PostTaggedEventHandler(updatePostTagsHandler, postRepository, logger);
    const postId = uuidv7();

    const executeSpy = vi.spyOn(updatePostTagsHandler, 'execute');

    await eventHandler.handle(makeMessage({ postId, postUpdatedAt }));

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('should skip applying tags when the post no longer exists', async () => {
    const updatePostTagsHandler = makeUpdatePostTagsHandler();
    const logger = makeLogger();
    const postRepository = makePostRepository(null);
    const eventHandler = new PostTaggedEventHandler(updatePostTagsHandler, postRepository, logger);

    const executeSpy = vi.spyOn(updatePostTagsHandler, 'execute');

    await eventHandler.handle(makeMessage());

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
