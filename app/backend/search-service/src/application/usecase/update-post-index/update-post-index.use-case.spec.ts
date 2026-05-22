import { uuidv7 } from 'uuidv7';
import UpdatePostIndexUseCase from './update-post-index.use-case';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import type { EventDispatcher, Logger } from '@drift/shared';
import { PostId } from '@drift/shared';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostIndexedEvent from '../../../domain/search-entry/event/post-indexed.event';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';

describe('UpdatePostIndexUseCase', () => {
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
    });

  it('should update the entry content, persist it, and dispatch PostIndexedEvent', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new UpdatePostIndexUseCase(repository, dispatcher, makeLogger());

    const postId = uuidv7();
    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(makeEntry(postId));
    const updateSpy = vi.spyOn(repository, 'update');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId, title: 'New Title', body: 'New body content.' });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const updated = updateSpy.mock.calls[0][0];
    expect(updated.title).toBe('New Title');
    expect(updated.body).toBe('New body content.');
    expect(updated.tags).toEqual(['existing-tag']);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostIndexedEvent));
  });

  it('should throw IndexingFailedError when the repository update fails', async () => {
    const repository = makeRepository();
    const useCase = new UpdatePostIndexUseCase(repository, makeDispatcher(), makeLogger());

    const postId = uuidv7();
    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(makeEntry(postId));
    (repository.update as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    await expect(
      useCase.execute({ postId, title: 'Title', body: 'Body content.' }),
    ).rejects.toThrow(IndexingFailedError);
  });

  it('should throw IndexingFailedError when the repository update rejects with a non-Error value', async () => {
    const repository = makeRepository();
    const useCase = new UpdatePostIndexUseCase(repository, makeDispatcher(), makeLogger());

    const postId = uuidv7();
    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(makeEntry(postId));
    (repository.update as ReturnType<typeof vi.fn>).mockRejectedValue('raw string error');

    await expect(
      useCase.execute({ postId, title: 'Title', body: 'Body content.' }),
    ).rejects.toThrow(IndexingFailedError);
  });

  it('should throw DocumentNotFoundError when entry does not exist', async () => {
    const useCase = new UpdatePostIndexUseCase(makeRepository(), makeDispatcher(), makeLogger());

    await expect(
      useCase.execute({ postId: uuidv7(), title: 'Title', body: 'Body content.' }),
    ).rejects.toThrow(DocumentNotFoundError);
  });
});
