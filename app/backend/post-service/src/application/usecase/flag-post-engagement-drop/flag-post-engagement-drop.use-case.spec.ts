import { uuidv7 } from 'uuidv7';
import { PostId, ClientId, type EventDispatcher, type Logger } from '@drift/shared';
import FlagPostEngagementDropUseCase from './flag-post-engagement-drop.use-case';
import Post from '../../../domain/post/entity/post.aggregate';
import type PostRepository from '../../../domain/post/repository/post.repository';
import EngagementDropFlaggedEvent from '../../../domain/post/event/engagement-drop-flagged.event';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

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

const makeFeaturedPost = (postId: string): Post => {
  const post = Post.create({
    id: new PostId(postId),
    clientId: new ClientId(uuidv7()),
    clientName: 'John Doe',
    title: 'My Post',
    body: 'Body content.',
  });
  post.promote();
  post.clearDomainEvents();
  return post;
};

const makeUnpromotedPost = (postId: string): Post => {
  const post = Post.create({
    id: new PostId(postId),
    clientId: new ClientId(uuidv7()),
    clientName: 'John Doe',
    title: 'My Post',
    body: 'Body content.',
  });
  post.clearDomainEvents();
  return post;
};

describe('FlagPostEngagementDropUseCase', () => {
  let repository: PostRepository;
  let dispatcher: EventDispatcher;
  let useCase: FlagPostEngagementDropUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new FlagPostEngagementDropUseCase(repository, dispatcher, makeLogger());
  });

  it('should flag the engagement drop, save and dispatch EngagementDropFlaggedEvent', async () => {
    const postId = uuidv7();
    const existing = makeFeaturedPost(postId);
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(existing.engagementDropFlagged).toBe(true);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(EngagementDropFlaggedEvent));
    const dispatched = dispatchSpy.mock.calls[0][0] as EngagementDropFlaggedEvent;
    expect(dispatched.payload.postId).toBe(postId);
  });

  it('should call findById, then save, then dispatch in order', async () => {
    const postId = uuidv7();
    const existing = makeFeaturedPost(postId);

    const callOrder: string[] = [];
    vi.spyOn(repository, 'findById').mockImplementation(() => {
      callOrder.push('findById');
      return Promise.resolve(existing);
    });
    vi.spyOn(repository, 'save').mockImplementation(() => {
      callOrder.push('save');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId });

    expect(callOrder).toEqual(['findById', 'save', 'dispatch']);
  });

  it('should throw PostNotFoundError when the post does not exist', async () => {
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(useCase.execute({ postId: uuidv7() })).rejects.toThrow(PostNotFoundError);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should be a no-op (no event, no flag) when the post is not featured', async () => {
    const postId = uuidv7();
    const existing = makeUnpromotedPost(postId);
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(useCase.execute({ postId })).resolves.toBeUndefined();
    expect(existing.engagementDropFlagged).toBe(false);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should be a no-op (no event) when flagging an already-flagged post', async () => {
    const postId = uuidv7();
    const existing = makeFeaturedPost(postId);
    existing.flagEngagementDrop();
    existing.clearDomainEvents();
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId });

    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
