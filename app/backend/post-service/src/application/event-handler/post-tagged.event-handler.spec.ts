import { uuidv7 } from 'uuidv7';
import PostTaggedEventHandler, { type PostTaggedMessage } from './post-tagged.event-handler';
import type UpdatePostTagsHandler from '../command/update-post-tags/update-post-tags.handler';
import UpdatePostTagsCommand from '../command/update-post-tags/update-post-tags.command';

type MessageOverrides = Partial<Pick<PostTaggedMessage['payload'], 'postId' | 'tags'>>;

describe('PostTaggedEventHandler', () => {
  const makeUpdatePostTagsHandler = (): UpdatePostTagsHandler =>
    ({
      execute: vi.fn().mockResolvedValue(undefined),
    }) as unknown as UpdatePostTagsHandler;

  const makeMessage = (overrides: MessageOverrides = {}): PostTaggedMessage => ({
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

    const executeSpy = vi.spyOn(updatePostTagsHandler, 'execute');

    await eventHandler.handle(makeMessage({ postId, tags }));

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const command = executeSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(UpdatePostTagsCommand);
    expect(command.postId).toBe(postId);
    expect(command.tags).toEqual(tags);
  });
});
