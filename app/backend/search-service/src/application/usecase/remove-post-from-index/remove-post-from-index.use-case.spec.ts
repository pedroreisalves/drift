import { uuidv7 } from 'uuidv7';
import RemovePostFromIndexUseCase from './remove-post-from-index.use-case';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import type { EventDispatcher, Logger } from '@drift/shared';
import { PostId } from '@drift/shared';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostRemovedFromIndexEvent from '../../../domain/search-entry/event/post-removed-from-index.event';
import RemovalFailedError from '../../@shared/error/removal-failed.error';

const makeRepository = (): SearchEntryRepository => ({
  index: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  findByPostId: vi.fn().mockResolvedValue(null),
  search: vi.fn().mockResolvedValue([]),
});

const makeDispatcher = (): EventDispatcher => ({
  dispatch: vi.fn().mockResolvedValue(undefined),
});

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeEntry = (postId = uuidv7()): SearchEntry =>
  SearchEntry.reconstruct({
    postId: new PostId(postId),
    title: 'A Post',
    body: 'Body content.',
    tags: [],
    isFeatured: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    isTaggingInProgress: false,
  });

describe('RemovePostFromIndexUseCase', () => {
  let repository: SearchEntryRepository;
  let dispatcher: EventDispatcher;
  let useCase: RemovePostFromIndexUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new RemovePostFromIndexUseCase(repository, dispatcher, makeLogger());
  });

  it('should remove the entry and dispatch PostRemovedFromIndexEvent', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));
    const removeSpy = vi.spyOn(repository, 'remove');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId });

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy.mock.calls[0][0].toString()).toBe(postId);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostRemovedFromIndexEvent));
  });

  it('should call repository.remove before dispatcher.dispatch', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));

    const callOrder: string[] = [];
    vi.spyOn(repository, 'remove').mockImplementation(() => {
      callOrder.push('repository.remove');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId });

    expect(callOrder).toEqual(['repository.remove', 'dispatcher.dispatch']);
  });

  it('should skip removal and not dispatch when the document does not exist', async () => {
    const removeSpy = vi.spyOn(repository, 'remove');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId: uuidv7() });

    expect(removeSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should throw RemovalFailedError when the repository remove fails', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));
    vi.spyOn(repository, 'remove').mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute({ postId })).rejects.toThrow(RemovalFailedError);
  });

  it('should throw RemovalFailedError when the repository remove rejects with a non-Error value', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));
    vi.spyOn(repository, 'remove').mockRejectedValue('raw string error');

    await expect(useCase.execute({ postId })).rejects.toThrow(RemovalFailedError);
  });
});
