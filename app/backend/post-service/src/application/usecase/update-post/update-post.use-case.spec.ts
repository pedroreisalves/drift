import { uuidv7 } from 'uuidv7';
import UpdatePostUseCase from './update-post.use-case';
import Post from '../../../domain/post/entity/post.aggregate';
import { PostId, ClientId, type EventDispatcher, type Logger } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostLockRepository from '../../../domain/post/repository/post-lock.repository';
import PostUpdatedEvent from '../../../domain/post/event/post-updated.event';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import { ForbiddenPostOperationError } from '../../@shared/error/forbidden-post-update.error';
import TaggingInProgressError from '../../@shared/error/tagging-in-progress.error';

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

describe('UpdatePostUseCase', () => {
  let repository: PostRepository;
  let dispatcher: EventDispatcher;
  let useCase: UpdatePostUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new UpdatePostUseCase(repository, makePostLockRepository(), dispatcher, makeLogger());
  });

  it('should fetch the post, persist the update, dispatch the PostUpdatedEvent and clear events', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId, clientId, title: 'Updated Title', body: 'Updated body.' });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    // instance-reference check: the aggregate passed to save is the same object
    expect(saveSpy.mock.calls[0][0]).toBe(existing);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostUpdatedEvent));

    expect(existing.getDomainEvents()).toEqual([]);
  });

  it('should call findById, then repository.save, then dispatcher.dispatch in order', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);

    const callOrder: string[] = [];
    vi.spyOn(repository, 'findById').mockImplementation(() => {
      callOrder.push('repository.findById');
      return Promise.resolve(existing);
    });
    vi.spyOn(repository, 'save').mockImplementation(() => {
      callOrder.push('repository.save');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId, clientId, title: 'Title', body: 'Body.' });

    expect(callOrder).toEqual(['repository.findById', 'repository.save', 'dispatcher.dispatch']);
  });

  it('should throw PostNotFoundError when the post does not exist', async () => {
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(
      useCase.execute({ postId: uuidv7(), clientId: uuidv7(), title: 'Title', body: 'Body.' }),
    ).rejects.toThrow(PostNotFoundError);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenPostOperationError when the post belongs to a different client', async () => {
    const postId = uuidv7();
    const ownerClientId = uuidv7();
    const otherClientId = uuidv7();
    const existing = makeExistingPost(postId, ownerClientId);
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(
      useCase.execute({ postId, clientId: otherClientId, title: 'Title', body: 'Body.' }),
    ).rejects.toThrow(ForbiddenPostOperationError);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should throw TaggingInProgressError when a tagging lock is active', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);

    useCase = new UpdatePostUseCase(
      repository,
      makePostLockRepository(true),
      dispatcher,
      makeLogger(),
    );
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(
      useCase.execute({ postId, clientId, title: 'Title', body: 'Body.' }),
    ).rejects.toThrow(TaggingInProgressError);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
