import { uuidv7 } from 'uuidv7';
import IndexPostHandler from './index-post.handler';
import IndexPostCommand from './index-post.command';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type { EventDispatcher, Logger } from '@drift/shared';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostIndexedEvent from '../../../domain/search-entry/event/post-indexed.event';
import IndexingFailedError from '../../@shared/error/indexing-failed.error';

describe('IndexPostHandler', () => {
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
    const handler = new IndexPostHandler(repository, dispatcher, makeLogger());
    const indexSpy = vi.spyOn(repository, 'index');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    const command = new IndexPostCommand(uuidv7(), 'My Post Title', 'Body content for the post.');
    await handler.execute(command);

    expect(indexSpy).toHaveBeenCalledTimes(1);
    const persisted = indexSpy.mock.calls[0][0];
    expect(persisted).toBeInstanceOf(SearchEntry);
    expect(persisted.postId.toString()).toBe(command.postId);
    expect(persisted.title).toBe(command.title);
    expect(persisted.body).toBe(command.body);
    expect(persisted.tags).toEqual([]);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostIndexedEvent));
  });

  it('should throw IndexingFailedError when the repository throws an Error', async () => {
    const repository = makeRepository();
    const handler = new IndexPostHandler(repository, makeDispatcher(), makeLogger());
    vi.spyOn(repository, 'index').mockRejectedValue(new Error('Meilisearch unreachable'));

    await expect(
      handler.execute(new IndexPostCommand(uuidv7(), 'Title', 'Body content.')),
    ).rejects.toThrow(IndexingFailedError);
  });

  it('should throw IndexingFailedError when the repository throws a non-Error value', async () => {
    const repository = makeRepository();
    const handler = new IndexPostHandler(repository, makeDispatcher(), makeLogger());
    vi.spyOn(repository, 'index').mockRejectedValue('raw string error');

    await expect(
      handler.execute(new IndexPostCommand(uuidv7(), 'Title', 'Body content.')),
    ).rejects.toThrow(IndexingFailedError);
  });

  it('should call repository.index before dispatcher.dispatch', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new IndexPostHandler(repository, dispatcher, makeLogger());

    const callOrder: string[] = [];
    vi.spyOn(repository, 'index').mockImplementation(() => {
      callOrder.push('repository.index');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await handler.execute(new IndexPostCommand(uuidv7(), 'Title', 'Body content.'));

    expect(callOrder).toEqual(['repository.index', 'dispatcher.dispatch']);
  });
});
