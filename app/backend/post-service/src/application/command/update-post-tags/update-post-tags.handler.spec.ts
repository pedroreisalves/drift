import { uuidv7 } from 'uuidv7';
import UpdatePostTagsHandler from './update-post-tags.handler';
import UpdatePostTagsCommand from './update-post-tags.command';
import Post from '../../../domain/post/entity/post.aggregate';
import { PostId } from '@drift/shared';
import { ClientId } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import { type EventDispatcher } from '@drift/shared';
import { type Logger } from '@drift/shared';
import PostTagsUpdated from '../../../domain/post/event/post-tags-updated.event';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

describe('UpdatePostTagsHandler', () => {
  const makeRepository = (): PostRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
  });

  const makeDispatcher = (): EventDispatcher => ({
    dispatch: vi.fn().mockResolvedValue(undefined),
  });

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeExistingPost = (postId: string): Post => {
    const post = Post.create({
      id: new PostId(postId),
      clientId: new ClientId(uuidv7()),
      clientName: 'John Doe',
      title: 'Original Title',
      body: 'Original body content.',
    });
    post.clearDomainEvents();
    return post;
  };

  it('should fetch the post, persist it, dispatch the PostTagsUpdatedEvent and clear events', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostTagsHandler(repository, dispatcher, makeLogger());

    const postId = uuidv7();
    const existing = makeExistingPost(postId);
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    const tags = ['tag1', 'tag2'];
    await handler.execute(new UpdatePostTagsCommand(postId, tags));

    const findByIdMock = repository.findById as ReturnType<typeof vi.fn>;
    const saveMock = repository.save as ReturnType<typeof vi.fn>;
    const dispatchMock = dispatcher.dispatch as ReturnType<typeof vi.fn>;

    expect(findByIdMock).toHaveBeenCalledTimes(1);

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock.mock.calls[0][0]).toBe(existing);

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith(expect.any(PostTagsUpdated));

    expect(existing.getDomainEvents()).toEqual([]);
  });

  it('should call findById, then repository.save, then dispatcher.dispatch in order', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostTagsHandler(repository, dispatcher, makeLogger());

    const postId = uuidv7();
    const existing = makeExistingPost(postId);

    const callOrder: string[] = [];
    (repository.findById as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('repository.findById');
      return existing;
    });
    (repository.save as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('repository.save');
    });
    (dispatcher.dispatch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
    });

    await handler.execute(new UpdatePostTagsCommand(postId, ['tag1']));

    expect(callOrder).toEqual(['repository.findById', 'repository.save', 'dispatcher.dispatch']);
  });

  it('should throw PostNotFoundError when the post does not exist', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostTagsHandler(repository, dispatcher, makeLogger());

    const command = new UpdatePostTagsCommand(uuidv7(), ['tag1']);

    await expect(handler.execute(command)).rejects.toThrow(PostNotFoundError);
    const saveMock = repository.save as ReturnType<typeof vi.fn>;
    const dispatchMock = dispatcher.dispatch as ReturnType<typeof vi.fn>;
    expect(saveMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
