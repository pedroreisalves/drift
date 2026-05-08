import { uuidv7 } from 'uuidv7';
import PostTaggedEventHandler from './post-tagged.event-handler';
import UpdatePostTagsHandler from '../command/update-post-tags/update-post-tags.handler';
import UpdatePostTagsCommand from '../command/update-post-tags/update-post-tags.command';

describe('PostTaggedEventHandler', () => {
  const makeUpdatePostTagsHandler = (): UpdatePostTagsHandler =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as UpdatePostTagsHandler;

  const makeMessage = (overrides: { postId?: string; tags?: string[] } = {}) => ({
    eventName: 'PostTagged',
    occurredAt: '2026-05-07T12:00:00.000Z',
    payload: {
      postId: overrides.postId ?? uuidv7(),
      tags: overrides.tags ?? ['tech', 'news'],
      taggedAt: '2026-05-07T12:00:00.000Z',
    },
  });

  it('should invoke UpdatePostTagsHandler.execute with a command built from the message payload', async () => {
    const updatePostTagsHandler = makeUpdatePostTagsHandler();
    const eventHandler = new PostTaggedEventHandler(updatePostTagsHandler);
    const postId = uuidv7();
    const tags = ['tech', 'news', 'sports'];

    await eventHandler.handle(makeMessage({ postId, tags }));

    expect(updatePostTagsHandler.execute).toHaveBeenCalledTimes(1);
    const command = (updatePostTagsHandler.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(command).toBeInstanceOf(UpdatePostTagsCommand);
    expect(command.postId).toBe(postId);
    expect(command.tags).toEqual(tags);
  });
});
