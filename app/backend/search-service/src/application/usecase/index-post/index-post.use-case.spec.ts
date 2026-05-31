import type { EventDispatcher, Logger } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostIndexedEvent from '../../../domain/search-entry/event/post-indexed.event';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';
import IndexPostUseCase from './index-post.use-case';

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

describe('IndexPostUseCase', () => {
  let repository: SearchEntryRepository;
  let dispatcher: EventDispatcher;
  let useCase: IndexPostUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new IndexPostUseCase(repository, dispatcher, makeLogger());
  });

  it('should create a SearchEntry, persist it, and dispatch PostIndexedEvent', async () => {
    const indexSpy = vi.spyOn(repository, 'index');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    const postId = uuidv7();
    const createdAt = '2026-05-01T12:00:00.000Z';
    await useCase.execute({
      postId,
      clientHash: 'a'.repeat(64),
      clientName: 'witty_owl042',
      title: 'My Post Title',
      body: 'Body content for the post.',
      createdAt,
    });

    expect(indexSpy).toHaveBeenCalledTimes(1);
    const persisted = indexSpy.mock.calls[0][0];
    expect(persisted).toBeInstanceOf(SearchEntry);
    expect(persisted.postId.toString()).toBe(postId);
    expect(persisted.title).toBe('My Post Title');
    expect(persisted.body).toBe('Body content for the post.');
    expect(persisted.tags).toEqual([]);
    expect(persisted.isFeatured).toBe(false);
    expect(persisted.createdAt.toISOString()).toBe(createdAt);
    expect(persisted.isTaggingInProgress).toBe(true);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostIndexedEvent));
  });

  it('should throw IndexingFailedError when the repository throws an Error, without dispatching', async () => {
    vi.spyOn(repository, 'index').mockRejectedValue(new Error('Meilisearch unreachable'));
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(
      useCase.execute({
        postId: uuidv7(),
        clientHash: 'a'.repeat(64),
        clientName: 'witty_owl042',
        title: 'Title',
        body: 'Body content.',
        createdAt: '2026-05-01T12:00:00.000Z',
      }),
    ).rejects.toThrow(IndexingFailedError);

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should throw IndexingFailedError when the repository throws a non-Error value, without dispatching', async () => {
    vi.spyOn(repository, 'index').mockRejectedValue('raw string error');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(
      useCase.execute({
        postId: uuidv7(),
        clientHash: 'a'.repeat(64),
        clientName: 'witty_owl042',
        title: 'Title',
        body: 'Body content.',
        createdAt: '2026-05-01T12:00:00.000Z',
      }),
    ).rejects.toThrow(IndexingFailedError);

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should call repository.index before dispatcher.dispatch', async () => {
    const callOrder: string[] = [];
    vi.spyOn(repository, 'index').mockImplementation(() => {
      callOrder.push('repository.index');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({
      postId: uuidv7(),
      clientHash: 'a'.repeat(64),
      clientName: 'witty_owl042',
      title: 'Title',
      body: 'Body content.',
      createdAt: '2026-05-01T12:00:00.000Z',
    });

    expect(callOrder).toEqual(['repository.index', 'dispatcher.dispatch']);
  });
});
