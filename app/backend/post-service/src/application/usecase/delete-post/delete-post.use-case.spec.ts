import { ClientId, type EventDispatcher, type Logger, PostId } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import Post from '../../../domain/post/entity/post.aggregate';
import FeaturedPostRemovedEvent from '../../../domain/post/event/featured-post-removed.event';
import PostDeletedEvent from '../../../domain/post/event/post-deleted.event';
import type PostRepository from '../../../domain/post/repository/post.repository';
import { ForbiddenPostOperationError } from '../../@shared/error/forbidden-post-update.error';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import TaggingInProgressError from '../../@shared/error/tagging-in-progress.error';
import DeletePostUseCase from './delete-post.use-case';

const makeRepository = (): PostRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  findAllFeatured: vi.fn().mockResolvedValue([]),
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

const makeLockedPost = (postId: string, clientId: string): Post =>
  Post.reconstruct({
    id: new PostId(postId),
    clientId: new ClientId(clientId),
    clientName: 'John Doe',
    title: 'Original Title',
    body: 'Original body content.',
    tags: [],
    isFeatured: false,
    featuredAt: null,
    engagementDropFlagged: false,
    isTaggingInProgress: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

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
    expect(deleteSpy.mock.calls[0][0].toString()).toEqual(postId);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostDeletedEvent));
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

  it('should also remove featured state and dispatch FeaturedPostRemovedEvent when deleting a featured post', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    const existing = makeExistingPost(postId, clientId);
    existing.promote();
    existing.clearDomainEvents();
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId, clientId });

    expect(existing.isFeatured).toBe(false);

    const dispatchedTypes = dispatchSpy.mock.calls.map((call) => call[0].constructor);
    expect(dispatchedTypes).toEqual([FeaturedPostRemovedEvent, PostDeletedEvent]);
  });

  it('should not emit FeaturedPostRemovedEvent when deleting a non-featured post', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    vi.spyOn(repository, 'findById').mockResolvedValue(makeExistingPost(postId, clientId));
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId, clientId });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostDeletedEvent));
  });

  it('should throw TaggingInProgressError when a tagging lock is active', async () => {
    const postId = uuidv7();
    const clientId = uuidv7();
    vi.spyOn(repository, 'findById').mockResolvedValue(makeLockedPost(postId, clientId));
    const deleteSpy = vi.spyOn(repository, 'delete');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(useCase.execute({ postId, clientId })).rejects.toThrow(TaggingInProgressError);
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
