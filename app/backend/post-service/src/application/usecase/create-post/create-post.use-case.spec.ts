import { uuidv7 } from 'uuidv7';
import CreatePostUseCase from './create-post.use-case';
import Post from '../../../domain/post/entity/post.aggregate';
import type PostRepository from '../../../domain/post/repository/post.repository';
import { type EventDispatcher } from '@drift/shared';
import { type Logger } from '@drift/shared';
import PostCreatedEvent from '../../../domain/post/event/post-created.event';

describe('CreatePostUseCase', () => {
  const makeRepository = (): PostRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
  });

  const makeDispatcher = (): EventDispatcher => ({
    dispatch: vi.fn().mockResolvedValue(undefined),
  });

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  it('should persist the created post, dispatch its events, clear them and return the post id', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new CreatePostUseCase(repository, dispatcher, makeLogger());

    const postId = await useCase.execute({
      clientId: uuidv7(),
      clientName: 'John Doe',
      title: 'My First Post',
      body: 'This is the body of my first post.',
    });

    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const persisted = saveSpy.mock.calls[0][0];
    expect(persisted).toBeInstanceOf(Post);
    expect(persisted.id.toString()).toEqual(postId);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostCreatedEvent));

    expect(persisted.getDomainEvents()).toEqual([]);
  });

  it('should call repository.save before dispatcher.dispatch', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const useCase = new CreatePostUseCase(repository, dispatcher, makeLogger());

    const callOrder: string[] = [];
    (repository.save as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('repository.save');
    });
    (dispatcher.dispatch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
    });

    await useCase.execute({
      clientId: uuidv7(),
      clientName: 'John Doe',
      title: 'My First Post',
      body: 'Body content.',
    });

    expect(callOrder).toEqual(['repository.save', 'dispatcher.dispatch']);
  });
});
