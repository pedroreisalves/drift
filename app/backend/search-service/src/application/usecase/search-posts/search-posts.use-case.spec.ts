import type { EventDispatcher, Logger } from '@drift/shared';
import { PostId } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostSearchedEvent from '../../../domain/search-entry/event/post-searched.event';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import SearchPostsUseCase from './search-posts.use-case';

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

const makeEntry = (postId = uuidv7(), overrides: Partial<SearchEntry> = {}): SearchEntry =>
  SearchEntry.reconstruct({
    postId: new PostId(postId),
    clientHash: 'a'.repeat(64),
    clientName: 'witty_owl042',
    title: 'A Post Title',
    body: 'Post body content.',
    tags: ['tag-a'],
    isFeatured: overrides.isFeatured ?? false,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    isTaggingInProgress: overrides.isTaggingInProgress ?? false,
  });

describe('SearchPostsUseCase', () => {
  let repository: SearchEntryRepository;
  let dispatcher: EventDispatcher;
  let useCase: SearchPostsUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new SearchPostsUseCase(repository, dispatcher, makeLogger());
  });

  it('should return search results as DTOs and dispatch PostSearchedEvent', async () => {
    const firstId = uuidv7();
    const secondId = uuidv7();
    const firstCreatedAt = new Date('2026-02-15T10:00:00.000Z');
    vi.spyOn(repository, 'search').mockResolvedValue([
      makeEntry(firstId, {
        isFeatured: true,
        createdAt: firstCreatedAt,
        isTaggingInProgress: true,
      }),
      makeEntry(secondId),
    ]);
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    const clientHash = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
    const result = await useCase.execute({ q: 'drift', clientHash });

    await Promise.resolve();

    expect(result).toHaveLength(2);
    expect(result[0].postId).toBe(firstId);
    expect(result[0].bodyPreview).toBe('Post body content.');
    expect(result[0].isFeatured).toBe(true);
    expect(result[0].createdAt).toBe(firstCreatedAt.toISOString());
    expect(result[0].isTaggingInProgress).toBe(true);
    expect(result[0].clientHash).toBe('a'.repeat(64));
    expect(result[0].clientName).toBe('witty_owl042');
    expect(result[1].postId).toBe(secondId);
    expect(result[1].isFeatured).toBe(false);
    expect(result[1].isTaggingInProgress).toBe(false);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostSearchedEvent));
    const dispatched = dispatchSpy.mock.calls[0][0] as PostSearchedEvent;
    expect(dispatched.payload.resultCount).toBe(2);
    expect(dispatched.payload.query).toBe('drift');
    expect(dispatched.payload.clientHash).toBe(clientHash);
  });

  it('should still return results when event dispatch fails with an Error', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'search').mockResolvedValue([makeEntry(postId)]);
    vi.spyOn(dispatcher, 'dispatch').mockRejectedValue(new Error('Analytics down'));

    const result = await useCase.execute({
      q: 'drift',
      clientHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    });

    await Promise.resolve();

    expect(result).toHaveLength(1);
    expect(result[0].postId).toBe(postId);
  });

  it('should still return results when event dispatch rejects with a non-Error value', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'search').mockResolvedValue([makeEntry(postId)]);
    vi.spyOn(dispatcher, 'dispatch').mockRejectedValue('raw string error');

    const result = await useCase.execute({
      q: 'drift',
      clientHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    });

    await Promise.resolve();

    expect(result).toHaveLength(1);
  });

  it('should forward the provided limit and offset to the repository', async () => {
    const searchSpy = vi.spyOn(repository, 'search');

    await useCase.execute({
      q: 'query',
      clientHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      limit: 20,
      offset: 5,
    });

    expect(searchSpy).toHaveBeenCalledWith({ q: 'query', limit: 20, offset: 5 });
  });

  it('should default to limit 10 and offset 0 when both are omitted', async () => {
    const searchSpy = vi.spyOn(repository, 'search');

    await useCase.execute({
      q: 'query',
      clientHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    });

    expect(searchSpy).toHaveBeenCalledWith({ q: 'query', limit: 10, offset: 0 });
  });

  it('should still return results and not dispatch when clientHash is absent', async () => {
    const postId = uuidv7();
    vi.spyOn(repository, 'search').mockResolvedValue([makeEntry(postId)]);
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    const result = await useCase.execute({ q: 'no-identity' });

    await Promise.resolve();

    expect(result).toHaveLength(1);
    expect(result[0].postId).toBe(postId);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
