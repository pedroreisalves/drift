import { uuidv7 } from 'uuidv7';
import UpdatePostHandler from './update-post.handler';
import UpdatePostCommand from './update-post.command';
import Post from '../../../domain/post/entity/post.aggregate';
import PostId from '../../../domain/post/value-object/post-id.value-object';
import ClientId from '../../../domain/post/value-object/client-id.value-object';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostLockRepository from '../../@shared/interface/post-lock.repository';
import type EventDispatcher from '../../@shared/interface/event-dispatcher.interface';
import type Logger from '../../@shared/interface/logger.interface';
import PostUpdatedEvent from '../../../domain/post/event/post-updated.event';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import ForbiddenPostUpdateError from '../../@shared/error/forbidden-post-update.error';
import TaggingInProgressError from '../../@shared/error/tagging-in-progress.error';

describe('UpdatePostHandler', () => {
  const makeRepository = (): PostRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
  });

  const makePostLockRepository = (locked = false): PostLockRepository => ({
    lock: vi.fn().mockResolvedValue(undefined),
    unlock: vi.fn().mockResolvedValue(undefined),
    isLocked: vi.fn().mockResolvedValue(locked),
  });

  const makeDispatcher = (): EventDispatcher => ({
    dispatch: vi.fn().mockResolvedValue(undefined),
  });

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
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
    const handler = new UpdatePostHandler(
      repository,
      makePostLockRepository(),
      dispatcher,
      makeLogger(),
    );

    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    await handler.execute(
      new UpdatePostCommand(postId, clientId, 'Updated Title', 'Updated body.'),
    );

    const findByIdMock = repository.findById as ReturnType<typeof vi.fn>;
    const saveMock = repository.save as ReturnType<typeof vi.fn>;
    const dispatchMock = dispatcher.dispatch as ReturnType<typeof vi.fn>;

    expect(findByIdMock).toHaveBeenCalledTimes(1);

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock.mock.calls[0][0]).toBe(existing);

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith(expect.any(PostUpdatedEvent));

    expect(existing.getDomainEvents()).toEqual([]);
  });

  it('should call findById, then repository.save, then dispatcher.dispatch in order', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostHandler(
      repository,
      makePostLockRepository(),
      dispatcher,
      makeLogger(),
    );

    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);

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

    await handler.execute(new UpdatePostCommand(postId, clientId, 'Title', 'Body.'));

    expect(callOrder).toEqual(['repository.findById', 'repository.save', 'dispatcher.dispatch']);
  });

  it('should throw PostNotFoundError when the post does not exist', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostHandler(
      repository,
      makePostLockRepository(),
      dispatcher,
      makeLogger(),
    );

    const command = new UpdatePostCommand(uuidv7(), uuidv7(), 'Title', 'Body.');

    await expect(handler.execute(command)).rejects.toThrow(PostNotFoundError);
    const saveMock = repository.save as ReturnType<typeof vi.fn>;
    const dispatchMock = dispatcher.dispatch as ReturnType<typeof vi.fn>;
    expect(saveMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenPostUpdateError when the post belongs to a different client', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostHandler(
      repository,
      makePostLockRepository(),
      dispatcher,
      makeLogger(),
    );

    const postId = uuidv7();
    const ownerClientId = uuidv7();
    const otherClientId = uuidv7();
    const existing = makeExistingPost(postId, ownerClientId);
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    const command = new UpdatePostCommand(postId, otherClientId, 'Title', 'Body.');

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenPostUpdateError);
    const saveMock = repository.save as ReturnType<typeof vi.fn>;
    const dispatchMock = dispatcher.dispatch as ReturnType<typeof vi.fn>;
    expect(saveMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('should throw TaggingInProgressError when a tagging lock is active', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new UpdatePostHandler(
      repository,
      makePostLockRepository(true),
      dispatcher,
      makeLogger(),
    );

    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    const command = new UpdatePostCommand(postId, clientId, 'Title', 'Body.');

    await expect(handler.execute(command)).rejects.toThrow(TaggingInProgressError);
    const saveMock = repository.save as ReturnType<typeof vi.fn>;
    const dispatchMock = dispatcher.dispatch as ReturnType<typeof vi.fn>;
    expect(saveMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
