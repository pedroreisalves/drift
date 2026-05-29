import { ClientId, type EventDispatcher, type Logger, PostId } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import Post from '../../../domain/post/entity/post.aggregate';
import type PostDemotedEvent from '../../../domain/post/event/post-demoted.event';
import PostUpdatedEvent from '../../../domain/post/event/post-updated.event';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostFeaturedRepository from '../../../domain/post/repository/post-featured.repository';
import type PostLockRepository from '../../../domain/post/repository/post-lock.repository';
import { ForbiddenPostOperationError } from '../../@shared/error/forbidden-post-update.error';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import TaggingInProgressError from '../../@shared/error/tagging-in-progress.error';
import UpdatePostUseCase from './update-post.use-case';

const makeRepository = (): PostRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  findAllFeatured: vi.fn().mockResolvedValue([]),
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

const makePostFeaturedRepository = (): PostFeaturedRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

const makeFeaturedPost = (postId: string, clientId: string): Post => {
  const post = Post.create({
    id: new PostId(postId),
    clientId: new ClientId(clientId),
    clientName: 'John Doe',
    title: 'Original Title',
    body: 'Original body content.',
  });
  post.promote();
  post.clearDomainEvents();
  return post;
};

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
  let postFeaturedRepository: PostFeaturedRepository;
  let dispatcher: EventDispatcher;
  let useCase: UpdatePostUseCase;

  beforeEach(() => {
    repository = makeRepository();
    postFeaturedRepository = makePostFeaturedRepository();
    dispatcher = makeDispatcher();
    useCase = new UpdatePostUseCase(
      repository,
      makePostLockRepository(),
      postFeaturedRepository,
      dispatcher,
      makeLogger(),
    );
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

  it('should demote a featured post when updated, persist, delete from postFeaturedRepository, and dispatch PostUpdatedEvent and PostDemotedEvent', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    const featured = makeFeaturedPost(postId, clientId);
    vi.spyOn(repository, 'findById').mockResolvedValue(featured);
    const saveSpy = vi.spyOn(repository, 'save');
    const deleteFeaturedSpy = vi.spyOn(postFeaturedRepository, 'delete');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId, clientId, title: 'New Title', body: 'New body.' });

    expect(featured.isFeatured).toBe(false);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy.mock.calls[0][0]).toBe(featured);
    expect(deleteFeaturedSpy).toHaveBeenCalledTimes(1);
    expect(deleteFeaturedSpy.mock.calls[0][0].toString()).toBe(postId);
    expect(dispatchSpy).toHaveBeenCalledTimes(2);
    const eventNames = dispatchSpy.mock.calls.map((c) => (c[0] as { eventName: string }).eventName);
    expect(eventNames).toContain('PostUpdated');
    expect(eventNames).toContain('PostDemoted');
    const demotedCall = dispatchSpy.mock.calls.find(
      (c) => (c[0] as { eventName: string }).eventName === 'PostDemoted',
    );
    expect((demotedCall![0] as PostDemotedEvent).payload.reason).toBe('post_updated');
  });

  it('should not call postFeaturedRepository.delete when post is not featured', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    const unfeatured = makeExistingPost(postId, clientId);
    vi.spyOn(repository, 'findById').mockResolvedValue(unfeatured);
    const deleteFeaturedSpy = vi.spyOn(postFeaturedRepository, 'delete');

    await useCase.execute({ postId, clientId, title: 'New Title', body: 'New body.' });

    expect(deleteFeaturedSpy).not.toHaveBeenCalled();
  });

  it('should call findById, save, postFeaturedRepository.delete, then dispatch in order for a featured post', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    const featured = makeFeaturedPost(postId, clientId);
    const callOrder: string[] = [];
    vi.spyOn(repository, 'findById').mockImplementation(() => {
      callOrder.push('repository.findById');
      return Promise.resolve(featured);
    });
    vi.spyOn(repository, 'save').mockImplementation(() => {
      callOrder.push('repository.save');
      return Promise.resolve();
    });
    vi.spyOn(postFeaturedRepository, 'delete').mockImplementation(() => {
      callOrder.push('postFeaturedRepository.delete');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId, clientId, title: 'Title', body: 'Body.' });

    expect(callOrder).toEqual([
      'repository.findById',
      'repository.save',
      'postFeaturedRepository.delete',
      'dispatcher.dispatch',
      'dispatcher.dispatch',
    ]);
  });

  it('should throw TaggingInProgressError when a tagging lock is active', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);

    useCase = new UpdatePostUseCase(
      repository,
      makePostLockRepository(true),
      makePostFeaturedRepository(),
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
