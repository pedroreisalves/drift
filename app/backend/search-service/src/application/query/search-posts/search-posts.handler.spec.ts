import { uuidv7 } from 'uuidv7';
import SearchPostsHandler from './search-posts.handler';
import SearchPostsQuery from './search-posts.command';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type { EventDispatcher, Logger } from '@drift/shared';
import { PostId } from '@drift/shared';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostSearchedEvent from '../../../domain/search-entry/event/post-searched.event';

describe('SearchPostsHandler', () => {
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
      tags: ['tag-a'],
    });

  it('should return search results as DTOs and dispatch PostSearchedEvent', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new SearchPostsHandler(repository, dispatcher, makeLogger());

    const firstId = uuidv7();
    const secondId = uuidv7();
    (repository.search as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeEntry(firstId),
      makeEntry(secondId),
    ]);
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    const result = await handler.execute(new SearchPostsQuery('drift', uuidv7()));

    expect(result).toHaveLength(2);
    expect(result[0].postId).toBe(firstId);
    expect(result[1].postId).toBe(secondId);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostSearchedEvent));
    const event = dispatchSpy.mock.calls[0][0] as PostSearchedEvent;
    expect(event.payload.resultCount).toBe(2);
    expect(event.payload.query).toBe('drift');
  });

  it('should forward the provided limit and offset to the repository', async () => {
    const repository = makeRepository();
    const handler = new SearchPostsHandler(repository, makeDispatcher(), makeLogger());
    const searchSpy = vi.spyOn(repository, 'search');

    await handler.execute(new SearchPostsQuery('query', uuidv7(), 20, 5));

    expect(searchSpy).toHaveBeenCalledWith({ q: 'query', limit: 20, offset: 5 });
  });

  it('should default to limit 10 and offset 0 when both are omitted', async () => {
    const repository = makeRepository();
    const handler = new SearchPostsHandler(repository, makeDispatcher(), makeLogger());
    const searchSpy = vi.spyOn(repository, 'search');

    await handler.execute(new SearchPostsQuery('query', uuidv7()));

    expect(searchSpy).toHaveBeenCalledWith({ q: 'query', limit: 10, offset: 0 });
  });
});
