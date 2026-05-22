import { uuidv7 } from 'uuidv7';
import IndexPostTagsUseCase from './index-post-tags.use-case';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import type { EventDispatcher, Logger } from '@drift/shared';
import { PostId } from '@drift/shared';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostTagsIndexedEvent from '../../../domain/search-entry/event/post-tags-indexed.event';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';

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
    title: 'A Post Title',
    body: 'Post body content.',
    tags: [],
  });

describe('IndexPostTagsUseCase', () => {
  let repository: SearchEntryRepository;
  let dispatcher: EventDispatcher;
  let useCase: IndexPostTagsUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new IndexPostTagsUseCase(repository, dispatcher, makeLogger());
  });

  it('should update entry tags, persist it, and dispatch PostTagsIndexedEvent', async () => {
    const postId = uuidv7();
    const tags = ['rust', 'systems'];
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));
    const updateSpy = vi.spyOn(repository, 'update');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId, tags });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const updated = updateSpy.mock.calls[0][0];
    expect(updated.tags).toEqual(tags);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostTagsIndexedEvent));
    const dispatched = dispatchSpy.mock.calls[0][0] as PostTagsIndexedEvent;
    expect(dispatched.payload.postId).toBe(postId);
    expect(dispatched.payload.tags).toEqual(tags);
  });

  it('should throw DocumentNotFoundError when entry does not exist, without persisting or dispatching', async () => {
    const updateSpy = vi.spyOn(repository, 'update');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(useCase.execute({ postId: uuidv7(), tags: ['tag'] })).rejects.toThrow(
      DocumentNotFoundError,
    );

    expect(updateSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should throw IndexingFailedError when the repository update fails', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));
    vi.spyOn(repository, 'update').mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute({ postId, tags: ['tag'] })).rejects.toThrow(IndexingFailedError);
  });

  it('should throw IndexingFailedError when the repository update rejects with a non-Error value', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));
    vi.spyOn(repository, 'update').mockRejectedValue('raw string error');

    await expect(useCase.execute({ postId, tags: ['tag'] })).rejects.toThrow(IndexingFailedError);
  });

  it('should call repository.findByPostId, then repository.update, then dispatcher.dispatch in order', async () => {
    const postId = uuidv7();

    const callOrder: string[] = [];
    vi.spyOn(repository, 'findByPostId').mockImplementation(() => {
      callOrder.push('repository.findByPostId');
      return Promise.resolve(makeEntry(postId));
    });
    vi.spyOn(repository, 'update').mockImplementation(() => {
      callOrder.push('repository.update');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId, tags: ['tag'] });

    expect(callOrder).toEqual([
      'repository.findByPostId',
      'repository.update',
      'dispatcher.dispatch',
    ]);
  });
});
