import { uuidv7 } from 'uuidv7';
import IndexPostTagsUseCase from './index-post-tags.use-case';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type { EventDispatcher, Logger } from '@drift/shared';
import { PostId } from '@drift/shared';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostTagsIndexedEvent from '../../../domain/search-entry/event/post-tags-indexed.event';
import DocumentNotFoundError from '../../@shared/error/document-not-found.error';

describe('IndexPostTagsUseCase', () => {
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

  it('should update entry tags, persist it, and dispatch PostTagsIndexedEvent', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new IndexPostTagsUseCase(repository, dispatcher, makeLogger());

    const postId = uuidv7();
    const tags = ['rust', 'systems'];
    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(makeEntry(postId));
    const updateSpy = vi.spyOn(repository, 'update');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId, tags });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const updated = updateSpy.mock.calls[0][0];
    expect(updated.tags).toEqual(tags);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostTagsIndexedEvent));
    const event = dispatchSpy.mock.calls[0][0] as PostTagsIndexedEvent;
    expect(event.payload.postId).toBe(postId);
    expect(event.payload.tags).toEqual(tags);
  });

  it('should throw DocumentNotFoundError when entry does not exist', async () => {
    const repository = makeRepository();
    const useCase = new IndexPostTagsUseCase(repository, makeDispatcher(), makeLogger());

    await expect(useCase.execute({ postId: uuidv7(), tags: ['tag'] })).rejects.toThrow(
      DocumentNotFoundError,
    );
  });

  it('should call repository.update before dispatcher.dispatch', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new IndexPostTagsUseCase(repository, dispatcher, makeLogger());

    const postId = uuidv7();
    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(makeEntry(postId));

    const callOrder: string[] = [];
    vi.spyOn(repository, 'update').mockImplementation(() => {
      callOrder.push('repository.update');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId, tags: ['tag'] });

    expect(callOrder).toEqual(['repository.update', 'dispatcher.dispatch']);
  });
});
