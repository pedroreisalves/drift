import type { Logger } from '@drift/shared';
import { PostId } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';
import UpdateSearchEntryFeaturedStatusUseCase from './update-search-entry-featured-status.use-case';

const makeRepository = (): SearchEntryRepository => ({
  index: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  findByPostId: vi.fn().mockResolvedValue(null),
  search: vi.fn().mockResolvedValue([]),
});

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makeEntry = (postId = uuidv7(), isFeatured = false): SearchEntry =>
  SearchEntry.reconstruct({
    postId: new PostId(postId),
    clientHash: 'a'.repeat(64),
    clientName: 'witty_owl042',
    title: 'A Post Title',
    body: 'Post body content.',
    tags: ['tag-a'],
    isFeatured,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    isTaggingInProgress: false,
  });

describe('UpdateSearchEntryFeaturedStatusUseCase', () => {
  let repository: SearchEntryRepository;
  let useCase: UpdateSearchEntryFeaturedStatusUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new UpdateSearchEntryFeaturedStatusUseCase(repository, makeLogger());
  });

  it('should set isFeatured to true and persist the entry', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId, false));
    const updateSpy = vi.spyOn(repository, 'update');

    await useCase.execute({ postId, isFeatured: true });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const updated = updateSpy.mock.calls[0][0];
    expect(updated.isFeatured).toBe(true);
  });

  it('should set isFeatured to false and persist the entry', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId, true));
    const updateSpy = vi.spyOn(repository, 'update');

    await useCase.execute({ postId, isFeatured: false });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const updated = updateSpy.mock.calls[0][0];
    expect(updated.isFeatured).toBe(false);
  });

  it('should throw DocumentNotFoundError when entry does not exist, without persisting', async () => {
    const updateSpy = vi.spyOn(repository, 'update');

    await expect(useCase.execute({ postId: uuidv7(), isFeatured: true })).rejects.toThrow(
      DocumentNotFoundError,
    );

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should throw IndexingFailedError when the repository update fails', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId, false));
    vi.spyOn(repository, 'update').mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute({ postId, isFeatured: true })).rejects.toThrow(
      IndexingFailedError,
    );
  });

  it('should throw IndexingFailedError when the repository update rejects with a non-Error value', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId, false));
    vi.spyOn(repository, 'update').mockRejectedValue('raw string error');

    await expect(useCase.execute({ postId, isFeatured: true })).rejects.toThrow(
      IndexingFailedError,
    );
  });

  it('should call repository.findByPostId before repository.update', async () => {
    const postId = uuidv7();
    const callOrder: string[] = [];
    vi.spyOn(repository, 'findByPostId').mockImplementation(() => {
      callOrder.push('repository.findByPostId');
      return Promise.resolve(makeEntry(postId, false));
    });
    vi.spyOn(repository, 'update').mockImplementation(() => {
      callOrder.push('repository.update');
      return Promise.resolve();
    });

    await useCase.execute({ postId, isFeatured: true });

    expect(callOrder).toEqual(['repository.findByPostId', 'repository.update']);
  });
});
