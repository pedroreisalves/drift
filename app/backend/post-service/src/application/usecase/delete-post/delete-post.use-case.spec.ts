import { uuidv7 } from 'uuidv7';
import DeletePostUseCase from './delete-post.use-case';
import Post from '../../../domain/post/entity/post.aggregate';
import { PostId, ClientId, type EventDispatcher, type Logger } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import PostDeletedEvent from '../../../domain/post/event/post-deleted.event';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import { ForbiddenPostOperationError } from '../../@shared/error/forbidden-post-update.error';

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

describe('DeletePostUseCase', () => {
  let repository: PostRepository;
  let dispatcher: EventDispatcher;
  let useCase: DeletePostUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new DeletePostUseCase(repository, dispatcher, makeLogger());
  });

  it('should fetch the post, delete it and dispatch a PostDeletedEvent with correct payload', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    vi.spyOn(repository, 'findById').mockResolvedValue(makeExistingPost(postId, clientId));
    const deleteSpy = vi.spyOn(repository, 'delete');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId, clientId });

    expect(deleteSpy).toHaveBeenCalledTimes(1);
    // instance-reference check: the PostId passed to delete round-trips to the input string
    expect(deleteSpy.mock.calls[0][0].toString()).toEqual(postId);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostDeletedEvent));
    // Verify the event payload contains the correct postId and clientId
    const dispatched = dispatchSpy.mock.calls[0][0] as PostDeletedEvent;
    expect(dispatched.payload.postId).toBe(postId);
    expect(dispatched.payload.clientId).toBe(clientId);
  });

  it('should call findById, then repository.delete, then dispatcher.dispatch in order', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);

    const callOrder: string[] = [];
    vi.spyOn(repository, 'findById').mockImplementation(() => {
      callOrder.push('repository.findById');
      return Promise.resolve(existing);
    });
    vi.spyOn(repository, 'delete').mockImplementation(() => {
      callOrder.push('repository.delete');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId, clientId });

    expect(callOrder).toEqual(['repository.findById', 'repository.delete', 'dispatcher.dispatch']);
  });

  it('should throw PostNotFoundError when the post does not exist', async () => {
    const deleteSpy = vi.spyOn(repository, 'delete');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(useCase.execute({ postId: uuidv7(), clientId: uuidv7() })).rejects.toThrow(
      PostNotFoundError,
    );
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenPostOperationError when the post belongs to a different client', async () => {
    const postId = uuidv7();
    const ownerClientId = uuidv7();
    const otherClientId = uuidv7();
    vi.spyOn(repository, 'findById').mockResolvedValue(makeExistingPost(postId, ownerClientId));
    const deleteSpy = vi.spyOn(repository, 'delete');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(useCase.execute({ postId, clientId: otherClientId })).rejects.toThrow(
      ForbiddenPostOperationError,
    );
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
