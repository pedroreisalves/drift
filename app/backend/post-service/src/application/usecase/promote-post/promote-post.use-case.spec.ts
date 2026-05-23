import { uuidv7 } from 'uuidv7';
import { PostId, ClientId, type EventDispatcher, type Logger } from '@drift/shared';
import PromotePostUseCase from './promote-post.use-case';
import Post from '../../../domain/post/entity/post.aggregate';
import type PostRepository from '../../../domain/post/repository/post.repository';
import PostPromotedEvent from '../../../domain/post/event/post-promoted.event';
import EngagementDropRecoveredEvent from '../../../domain/post/event/engagement-drop-recovered.event';
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

const makeExistingPost = (postId: string): Post => {
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

describe('PromotePostUseCase', () => {
  let repository: PostRepository;
  let dispatcher: EventDispatcher;
  let useCase: PromotePostUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new PromotePostUseCase(repository, dispatcher, makeLogger());
  });

  it('should promote the post, save it and dispatch PostPromotedEvent', async () => {
    const postId = uuidv7();
    const existing = makeExistingPost(postId);
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(existing);
    expect(existing.isFeatured).toBe(true);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostPromotedEvent));
    const dispatched = dispatchSpy.mock.calls[0][0] as PostPromotedEvent;
    expect(dispatched.payload.postId).toBe(postId);
  });

  it('should call findById, then save, then dispatch in order', async () => {
    const postId = uuidv7();
    const existing = makeExistingPost(postId);

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

  it('should be a no-op (no event) when promoting an already-featured post', async () => {
    const postId = uuidv7();
    const existing = makeExistingPost(postId);
    existing.promote();
    existing.clearDomainEvents();
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId });

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should clear the engagement drop flag and dispatch EngagementDropRecoveredEvent when the post is already featured but flagged', async () => {
    const postId = uuidv7();
    const existing = makeExistingPost(postId);
    existing.promote();
    existing.flagEngagementDrop();
    existing.clearDomainEvents();
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId });

    expect(existing.isFeatured).toBe(true);
    expect(existing.engagementDropFlagged).toBe(false);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(EngagementDropRecoveredEvent));
    const dispatched = dispatchSpy.mock.calls[0][0] as EngagementDropRecoveredEvent;
    expect(dispatched.payload.postId).toBe(postId);
  });
});
