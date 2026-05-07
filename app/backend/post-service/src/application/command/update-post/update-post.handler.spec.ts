import { uuidv7 } from 'uuidv7';
import UpdatePostHandler from './update-post.handler';
import UpdatePostCommand from './update-post.command';
import Post from '../../../domain/post/entity/post.aggregate';
import PostId from '../../../domain/post/value-object/post-id.value-object';
import ClientId from '../../../domain/post/value-object/client-id.value-object';
import PostRepository from '../../../domain/post/repository/post.repository';
import EventDispatcher from '../../@shared/interface/event-dispatcher.interface';
import PostUpdatedEvent from '../../../domain/post/event/post-updated.event';
import { PostNotFoundError } from '../../@shared/error/post-not-found.error';
import { ForbiddenPostUpdateError } from '../../@shared/error/forbidden-post-update.error';

describe('UpdatePostHandler', () => {
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

  it('should fetch the post, persist the update, dispatch the PostUpdatedEvent and clear events', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostHandler(repository, dispatcher);

    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    await handler.execute(
      new UpdatePostCommand(postId, clientId, 'John Doe', 'Updated Title', 'Updated body.'),
    );

    expect(repository.findById).toHaveBeenCalledTimes(1);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect((repository.save as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(existing);

    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(expect.any(PostUpdatedEvent));

    expect(existing.getDomainEvents()).toEqual([]);
  });

  it('should call findById, then repository.save, then dispatcher.dispatch in order', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostHandler(repository, dispatcher);

    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);

    const callOrder: string[] = [];
    (repository.findById as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('repository.findById');
      return existing;
    });
    (repository.save as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('repository.save');
    });
    (dispatcher.dispatch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('dispatcher.dispatch');
    });

    await handler.execute(new UpdatePostCommand(postId, clientId, 'John Doe', 'Title', 'Body.'));

    expect(callOrder).toEqual(['repository.findById', 'repository.save', 'dispatcher.dispatch']);
  });

  it('should throw PostNotFoundError when the post does not exist', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostHandler(repository, dispatcher);

    const command = new UpdatePostCommand(uuidv7(), uuidv7(), 'John Doe', 'Title', 'Body.');

    await expect(handler.execute(command)).rejects.toThrow(PostNotFoundError);
    expect(repository.save).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenPostUpdateError when the post belongs to a different client', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostHandler(repository, dispatcher);

    const postId = uuidv7();
    const ownerClientId = uuidv7();
    const otherClientId = uuidv7();
    const existing = makeExistingPost(postId, ownerClientId);
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    const command = new UpdatePostCommand(postId, otherClientId, 'John Doe', 'Title', 'Body.');

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenPostUpdateError);
    expect(repository.save).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });
});
