import { uuidv7 } from 'uuidv7';
import DeletePostHandler from './delete-post.handler';
import DeletePostCommand from './delete-post.command';
import Post from '../../../domain/post/entity/post.aggregate';
import PostId from '../../../domain/post/value-object/post-id.value-object';
import ClientId from '../../../domain/post/value-object/client-id.value-object';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type EventDispatcher from '../../@shared/interface/event-dispatcher.interface';
import PostDeletedEvent from './post-deleted.event';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

describe('DeletePostHandler', () => {
  const makeRepository = (): PostRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
  });

  const makeDispatcher = (): EventDispatcher => ({
    dispatch: vi.fn().mockResolvedValue(undefined),
  });

  const makeExistingPost = (postId: string, clientId: string): Post => {
    const post = Post.create({
      id: new PostId(postId),
      clientId: new ClientId(clientId),
      clientName: 'John Doe',
      title: 'Original Title',
      body: 'Original body content.',
    });
    post.clearDomainEvents();
    return post;
  };

  it('should fetch the post, delete it and dispatch a PostDeletedEvent built from the command data', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new DeletePostHandler(repository, dispatcher);

    const postId = uuidv7();
    const clientId = uuidv7();
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeExistingPost(postId, clientId),
    );

    await handler.execute(new DeletePostCommand(postId, clientId));

    const deleteMock = repository.delete as ReturnType<typeof vi.fn>;
    const dispatchMock = dispatcher.dispatch as ReturnType<typeof vi.fn>;

    expect(deleteMock).toHaveBeenCalledTimes(1);
    const deletedId = deleteMock.mock.calls[0][0] as PostId;
    expect(deletedId.toString()).toEqual(postId);

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const dispatchedEvent = dispatchMock.mock.calls[0][0] as PostDeletedEvent;
    expect(dispatchedEvent).toBeInstanceOf(PostDeletedEvent);
    expect(dispatchedEvent.payload).toEqual({
      postId,
      clientId,
      deletedAt: expect.any(String) as string,
    });
  });

  it('should call findById, then repository.delete, then dispatcher.dispatch in order', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new DeletePostHandler(repository, dispatcher);

    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);

    const callOrder: string[] = [];
    (repository.findById as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('repository.findById');
      return existing;
    });
    (repository.delete as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('repository.delete');
    });
    (dispatcher.dispatch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
    });

    await handler.execute(new DeletePostCommand(postId, clientId));

    expect(callOrder).toEqual(['repository.findById', 'repository.delete', 'dispatcher.dispatch']);
  });

  it('should throw PostNotFoundError when the post does not exist', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new DeletePostHandler(repository, dispatcher);

    const command = new DeletePostCommand(uuidv7(), uuidv7());

    await expect(handler.execute(command)).rejects.toThrow(PostNotFoundError);
    const deleteMock = repository.delete as ReturnType<typeof vi.fn>;
    const dispatchMock = dispatcher.dispatch as ReturnType<typeof vi.fn>;
    expect(deleteMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
