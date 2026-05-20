import { uuidv7 } from 'uuidv7';
import RemovePostFromIndexUseCase from './remove-post-from-index.use-case';
import type SearchEntryRepository from '../../../domain/search-entry/repository/search-entry.repository.interface';
import type { EventDispatcher, Logger } from '@drift/shared';
import PostRemovedFromIndexEvent from '../../../domain/search-entry/event/post-removed-from-index.event';

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

  it('should remove the entry and dispatch PostRemovedFromIndexEvent', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new RemovePostFromIndexUseCase(repository, dispatcher, makeLogger());
    const removeSpy = vi.spyOn(repository, 'remove');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    const postId = uuidv7();
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

    const callOrder: string[] = [];
    vi.spyOn(repository, 'remove').mockImplementation(() => {
      callOrder.push('repository.remove');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId: uuidv7() });

    expect(callOrder).toEqual(['repository.remove', 'dispatcher.dispatch']);
  });
});
