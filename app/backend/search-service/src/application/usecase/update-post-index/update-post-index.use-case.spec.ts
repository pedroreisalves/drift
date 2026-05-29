import type { EventDispatcher, Logger } from '@drift/shared';
import { PostId } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostIndexedEvent from '../../../domain/search-entry/event/post-indexed.event';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';
import UpdatePostIndexUseCase from './update-post-index.use-case';

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
    title: 'Old Title',
    body: 'Old body content.',
    tags: ['existing-tag'],
    isFeatured: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    isTaggingInProgress: false,
  });

describe('UpdatePostIndexUseCase', () => {
  let repository: SearchEntryRepository;
  let dispatcher: EventDispatcher;
  let useCase: UpdatePostIndexUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new UpdatePostIndexUseCase(repository, dispatcher, makeLogger());
  });

  it('should update the entry content, persist it, and dispatch PostIndexedEvent', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));
    const updateSpy = vi.spyOn(repository, 'update');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId, title: 'New Title', body: 'New body content.' });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const updated = updateSpy.mock.calls[0][0];
    expect(updated.title).toBe('New Title');
    expect(updated.body).toBe('New body content.');
    expect(updated.tags).toEqual([]);
    expect(updated.isTaggingInProgress).toBe(true);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostIndexedEvent));
  });

  it('should throw IndexingFailedError when the repository update fails', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));
    vi.spyOn(repository, 'update').mockRejectedValue(new Error('DB error'));

    await expect(
      useCase.execute({ postId, title: 'Title', body: 'Body content.' }),
    ).rejects.toThrow(IndexingFailedError);
  });

  it('should throw IndexingFailedError when the repository update rejects with a non-Error value', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));
    vi.spyOn(repository, 'update').mockRejectedValue('raw string error');

    await expect(
      useCase.execute({ postId, title: 'Title', body: 'Body content.' }),
    ).rejects.toThrow(IndexingFailedError);
  });

  it('should throw DocumentNotFoundError when entry does not exist, without persisting or dispatching', async () => {
    const updateSpy = vi.spyOn(repository, 'update');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(
      useCase.execute({ postId: uuidv7(), title: 'Title', body: 'Body content.' }),
    ).rejects.toThrow(DocumentNotFoundError);

    expect(updateSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should call repository.update before dispatcher.dispatch', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId));

    const callOrder: string[] = [];
    vi.spyOn(repository, 'update').mockImplementation(() => {
      callOrder.push('repository.update');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId, title: 'Title', body: 'Body content.' });

    expect(callOrder).toEqual(['repository.update', 'dispatcher.dispatch']);
  });
});
