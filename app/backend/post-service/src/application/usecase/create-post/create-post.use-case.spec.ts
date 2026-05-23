import { uuidv7 } from 'uuidv7';
import CreatePostUseCase from './create-post.use-case';
import Post from '../../../domain/post/entity/post.aggregate';
import type PostRepository from '../../../domain/post/repository/post.repository';
import { type EventDispatcher, type Logger } from '@drift/shared';
import PostCreatedEvent from '../../../domain/post/event/post-created.event';

const makeRepository = (): PostRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  findAllFeatured: vi.fn().mockResolvedValue([]),
});

const makeDispatcher = (): EventDispatcher => ({
  dispatch: vi.fn().mockResolvedValue(undefined),
});

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('CreatePostUseCase', () => {
  let repository: PostRepository;
  let dispatcher: EventDispatcher;
  let useCase: CreatePostUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new CreatePostUseCase(repository, dispatcher, makeLogger());
  });

  it('should persist the post, dispatch PostCreatedEvent, clear events and return the new id as OutputDto', async () => {
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    const output = await useCase.execute({
      clientId: uuidv7(),
      clientName: 'John Doe',
      title: 'My First Post',
      body: 'This is the body of my first post.',
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(expect.any(Post));
    expect(saveSpy.mock.calls[0][0].id.toString()).toBe(output.postId);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostCreatedEvent));

    expect(saveSpy.mock.calls[0][0].getDomainEvents()).toEqual([]);
  });

  it('should call repository.save before dispatcher.dispatch', async () => {
    const callOrder: string[] = [];
    vi.spyOn(repository, 'save').mockImplementation(() => {
      callOrder.push('repository.save');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({
      clientId: uuidv7(),
      clientName: 'John Doe',
      title: 'Title',
      body: 'Body.',
    });

    expect(callOrder).toEqual(['repository.save', 'dispatcher.dispatch']);
  });
});
