import { ClientId, type EventDispatcher, type Logger, PostId } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import Post from '../../../domain/post/entity/post.aggregate';
import PostDemotedEvent from '../../../domain/post/event/post-demoted.event';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostFeaturedRepository from '../../../domain/post/repository/post-featured.repository';
import {
  FEATURED_EXPIRY_DEMOTION_REASON,
  FEATURED_MAX_AGE_MS,
} from '../../@shared/constant/check-featured-expiry.constant';
import CheckFeaturedExpiryUseCase from './check-featured-expiry.use-case';

const makeRepository = (): PostRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  findAllFeatured: vi.fn().mockResolvedValue([]),
});

const makePostFeaturedRepository = (): PostFeaturedRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

const makeDispatcher = (): EventDispatcher => ({
  dispatch: vi.fn().mockResolvedValue(undefined),
});

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeFeaturedPost = (opts: { featuredAt: Date; flagged: boolean }): Post =>
  Post.reconstruct({
    id: new PostId(uuidv7()),
    clientId: new ClientId(uuidv7()),
    clientName: 'John Doe',
    title: 'My Post',
    body: 'Body.',
    tags: [],
    isFeatured: true,
    featuredAt: opts.featuredAt,
    engagementDropFlagged: opts.flagged,
    isTaggingInProgress: true,
    createdAt: opts.featuredAt,
    updatedAt: opts.featuredAt,
  });

describe('CheckFeaturedExpiryUseCase', () => {
  let repository: PostRepository;
  let postFeaturedRepository: PostFeaturedRepository;
  let dispatcher: EventDispatcher;
  let logger: Logger;
  let useCase: CheckFeaturedExpiryUseCase;

  beforeEach(() => {
    repository = makeRepository();
    postFeaturedRepository = makePostFeaturedRepository();
    dispatcher = makeDispatcher();
    logger = makeLogger();
    useCase = new CheckFeaturedExpiryUseCase(
      repository,
      postFeaturedRepository,
      dispatcher,
      logger,
    );
  });

  it('does nothing when there are no featured posts', async () => {
    const saveSpy = vi.spyOn(repository, 'save');
    const deleteFeaturedSpy = vi.spyOn(postFeaturedRepository, 'delete');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(deleteFeaturedSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('demotes a featured post that is older than 48h AND has engagement drop flagged', async () => {
    const featuredAt = new Date(Date.now() - FEATURED_MAX_AGE_MS - 1000);
    const post = makeFeaturedPost({ featuredAt, flagged: true });
    vi.spyOn(repository, 'findAllFeatured').mockResolvedValue([post]);
    const saveSpy = vi.spyOn(repository, 'save');
    const deleteFeaturedSpy = vi.spyOn(postFeaturedRepository, 'delete');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(post.isFeatured).toBe(false);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(deleteFeaturedSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostDemotedEvent));
    const dispatched = dispatchSpy.mock.calls[0][0] as PostDemotedEvent;
    expect(dispatched.payload.postId).toBe(post.id.toString());
    expect(dispatched.payload.reason).toBe(FEATURED_EXPIRY_DEMOTION_REASON);
  });

  it('does NOT demote a featured post that is older than 48h but not engagement-drop flagged', async () => {
    const featuredAt = new Date(Date.now() - FEATURED_MAX_AGE_MS - 1000);
    const post = makeFeaturedPost({ featuredAt, flagged: false });
    vi.spyOn(repository, 'findAllFeatured').mockResolvedValue([post]);
    const saveSpy = vi.spyOn(repository, 'save');
    const deleteFeaturedSpy = vi.spyOn(postFeaturedRepository, 'delete');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(deleteFeaturedSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does NOT demote a flagged featured post that has not yet reached 48h', async () => {
    const featuredAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const post = makeFeaturedPost({ featuredAt, flagged: true });
    vi.spyOn(repository, 'findAllFeatured').mockResolvedValue([post]);
    const saveSpy = vi.spyOn(repository, 'save');
    const deleteFeaturedSpy = vi.spyOn(postFeaturedRepository, 'delete');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(deleteFeaturedSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('demotes all expired posts in a single batch and dispatches one PostDemotedEvent per post', async () => {
    const old = new Date(Date.now() - FEATURED_MAX_AGE_MS - 1000);
    const postA = makeFeaturedPost({ featuredAt: old, flagged: true });
    const postB = makeFeaturedPost({ featuredAt: old, flagged: true });
    vi.spyOn(repository, 'findAllFeatured').mockResolvedValue([postA, postB]);
    const saveSpy = vi.spyOn(repository, 'save');
    const deleteFeaturedSpy = vi.spyOn(postFeaturedRepository, 'delete');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute();

    expect(postA.isFeatured).toBe(false);
    expect(postB.isFeatured).toBe(false);
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(deleteFeaturedSpy).toHaveBeenCalledTimes(2);
    expect(dispatchSpy).toHaveBeenCalledTimes(2);
    const dispatchedTypes = dispatchSpy.mock.calls.map((c) => c[0].constructor);
    expect(dispatchedTypes).toEqual([PostDemotedEvent, PostDemotedEvent]);
  });
});
