import { uuidv7 } from 'uuidv7';
import IndexPostUseCase from './index-post.use-case';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import type { EventDispatcher, Logger } from '@drift/shared';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostIndexedEvent from '../../../domain/search-entry/event/post-indexed.event';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';

describe('IndexPostUseCase', () => {
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

  it('should create a SearchEntry, persist it, and dispatch PostIndexedEvent', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new IndexPostUseCase(repository, dispatcher, makeLogger());
    const indexSpy = vi.spyOn(repository, 'index');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    const postId = uuidv7();
    await useCase.execute({ postId, title: 'My Post Title', body: 'Body content for the post.' });

    expect(indexSpy).toHaveBeenCalledTimes(1);
    const persisted = indexSpy.mock.calls[0][0];
    expect(persisted).toBeInstanceOf(SearchEntry);
    expect(persisted.postId.toString()).toBe(postId);
    expect(persisted.title).toBe('My Post Title');
    expect(persisted.body).toBe('Body content for the post.');
    expect(persisted.tags).toEqual([]);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostIndexedEvent));
  });

  it('should throw IndexingFailedError when the repository throws an Error', async () => {
    const repository = makeRepository();
    const useCase = new IndexPostUseCase(repository, makeDispatcher(), makeLogger());
    vi.spyOn(repository, 'index').mockRejectedValue(new Error('Meilisearch unreachable'));

    await expect(
      useCase.execute({ postId: uuidv7(), title: 'Title', body: 'Body content.' }),
    ).rejects.toThrow(IndexingFailedError);
  });

  it('should throw IndexingFailedError when the repository throws a non-Error value', async () => {
    const repository = makeRepository();
    const useCase = new IndexPostUseCase(repository, makeDispatcher(), makeLogger());
    vi.spyOn(repository, 'index').mockRejectedValue('raw string error');

    await expect(
      useCase.execute({ postId: uuidv7(), title: 'Title', body: 'Body content.' }),
    ).rejects.toThrow(IndexingFailedError);
  });

  it('should call repository.index before dispatcher.dispatch', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new IndexPostUseCase(repository, dispatcher, makeLogger());

    const callOrder: string[] = [];
    vi.spyOn(repository, 'index').mockImplementation(() => {
      callOrder.push('repository.index');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId: uuidv7(), title: 'Title', body: 'Body content.' });

    expect(callOrder).toEqual(['repository.index', 'dispatcher.dispatch']);
  });
});
