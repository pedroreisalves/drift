import { uuidv7 } from 'uuidv7';
import RemovePostFromIndexUseCase from './remove-post-from-index.use-case';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository';
import type { EventDispatcher, Logger } from '@drift/shared';
import { PostId } from '@drift/shared';
import SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import PostRemovedFromIndexEvent from '../../../domain/search-entry/event/post-removed-from-index.event';
import RemovalFailedError from '../../@shared/error/removal-failed.error';

describe('RemovePostFromIndexUseCase', () => {
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
      title: 'A Post',
      body: 'Body content.',
      tags: [],
    });

  it('should remove the entry and dispatch PostRemovedFromIndexEvent', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new RemovePostFromIndexUseCase(repository, dispatcher, makeLogger());

    const postId = uuidv7();
    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(makeEntry(postId));
    const removeSpy = vi.spyOn(repository, 'remove');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId });

    expect(removeSpy).toHaveBeenCalledTimes(1);
    const calledWith = removeSpy.mock.calls[0][0];
    expect(calledWith.toString()).toBe(postId);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostRemovedFromIndexEvent));
  });

  it('should call repository.remove before dispatcher.dispatch', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new RemovePostFromIndexUseCase(repository, dispatcher, makeLogger());

    const postId = uuidv7();
    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(makeEntry(postId));

    const callOrder: string[] = [];
    vi.spyOn(repository, 'remove').mockImplementation(() => {
      callOrder.push('repository.remove');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId });

    expect(callOrder).toEqual(['repository.remove', 'dispatcher.dispatch']);
  });

  it('should skip removal and not dispatch when the document does not exist', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new RemovePostFromIndexUseCase(repository, dispatcher, makeLogger());

    const removeSpy = vi.spyOn(repository, 'remove');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ postId: uuidv7() });

    expect(removeSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should throw RemovalFailedError when the repository remove fails', async () => {
    const repository = makeRepository();
    const useCase = new RemovePostFromIndexUseCase(repository, makeDispatcher(), makeLogger());

    const postId = uuidv7();
    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(makeEntry(postId));
    (repository.remove as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute({ postId })).rejects.toThrow(RemovalFailedError);
  });

  it('should throw RemovalFailedError when the repository remove rejects with a non-Error value', async () => {
    const repository = makeRepository();
    const useCase = new RemovePostFromIndexUseCase(repository, makeDispatcher(), makeLogger());

    const postId = uuidv7();
    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(makeEntry(postId));
    (repository.remove as ReturnType<typeof vi.fn>).mockRejectedValue('raw string error');

    await expect(useCase.execute({ postId })).rejects.toThrow(RemovalFailedError);
  });
});
