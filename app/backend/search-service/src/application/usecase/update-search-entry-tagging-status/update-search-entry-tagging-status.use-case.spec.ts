import { uuidv7 } from 'uuidv7';
import UpdateSearchEntryTaggingStatusUseCase from './update-search-entry-tagging-status.use-case';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import type { Logger } from '@drift/shared';
import { PostId } from '@drift/shared';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';

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

const makeEntry = (postId = uuidv7(), isTaggingInProgress = true): SearchEntry =>
  SearchEntry.reconstruct({
    postId: new PostId(postId),
    title: 'A Post Title',
    body: 'Post body content.',
    tags: [],
    isFeatured: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    isTaggingInProgress,
  });

describe('UpdateSearchEntryTaggingStatusUseCase', () => {
  let repository: SearchEntryRepository;
  let useCase: UpdateSearchEntryTaggingStatusUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new UpdateSearchEntryTaggingStatusUseCase(repository, makeLogger());
  });

  it('should set isTaggingInProgress to false and persist the entry', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId, true));
    const updateSpy = vi.spyOn(repository, 'update');

    await useCase.execute({ postId, isTaggingInProgress: false });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const updated = updateSpy.mock.calls[0][0];
    expect(updated.isTaggingInProgress).toBe(false);
  });

  it('should set isTaggingInProgress to true and persist the entry', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId, false));
    const updateSpy = vi.spyOn(repository, 'update');

    await useCase.execute({ postId, isTaggingInProgress: true });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const updated = updateSpy.mock.calls[0][0];
    expect(updated.isTaggingInProgress).toBe(true);
  });

  it('should throw DocumentNotFoundError when entry does not exist, without persisting', async () => {
    const updateSpy = vi.spyOn(repository, 'update');

    await expect(useCase.execute({ postId: uuidv7(), isTaggingInProgress: false })).rejects.toThrow(
      DocumentNotFoundError,
    );

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should throw IndexingFailedError when the repository update fails', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId, true));
    vi.spyOn(repository, 'update').mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute({ postId, isTaggingInProgress: false })).rejects.toThrow(
      IndexingFailedError,
    );
  });

  it('should throw IndexingFailedError when the repository update rejects with a non-Error value', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(makeEntry(postId, true));
    vi.spyOn(repository, 'update').mockRejectedValue('raw string error');

    await expect(useCase.execute({ postId, isTaggingInProgress: false })).rejects.toThrow(
      IndexingFailedError,
    );
  });

  it('should call repository.findByPostId before repository.update', async () => {
    const postId = uuidv7();
    const callOrder: string[] = [];
    vi.spyOn(repository, 'findByPostId').mockImplementation(() => {
      callOrder.push('repository.findByPostId');
      return Promise.resolve(makeEntry(postId, true));
    });
    vi.spyOn(repository, 'update').mockImplementation(() => {
      callOrder.push('repository.update');
      return Promise.resolve();
    });

    await useCase.execute({ postId, isTaggingInProgress: false });

    expect(callOrder).toEqual(['repository.findByPostId', 'repository.update']);
  });
});
