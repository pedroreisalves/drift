import { uuidv7 } from 'uuidv7';
import UpdatePostTagsUseCase from './update-post-tags.use-case';
import Post from '../../../domain/post/entity/post.aggregate';
import { PostId, ClientId, type EventDispatcher, type Logger } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import PostTagsUpdatedEvent from '../../../domain/post/event/post-tags-updated.event';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

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

const makeExistingPost = (postId: string): Post => {
  const post = Post.create({
    id: new PostId(postId),
    clientId: new ClientId(uuidv7()),
    clientName: 'John Doe',
    title: 'Original Title',
    body: 'Original body content.',
  });
  post.clearDomainEvents();
  return post;
};

describe('UpdatePostTagsUseCase', () => {
  let repository: PostRepository;
  let dispatcher: EventDispatcher;
  let useCase: UpdatePostTagsUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new UpdatePostTagsUseCase(repository, dispatcher, makeLogger());
  });

  it('should fetch the post, persist it, dispatch the PostTagsUpdatedEvent and clear events', async () => {
    const postId = uuidv7();
    const existing = makeExistingPost(postId);
    vi.spyOn(repository, 'findById').mockResolvedValue(existing);
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    const tags = ['tag1', 'tag2'];
    await useCase.execute({ postId, tags });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy.mock.calls[0][0]).toBe(existing);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostTagsUpdatedEvent));

    expect(existing.getDomainEvents()).toEqual([]);
  });

  it('should call findById, then repository.save, then dispatcher.dispatch in order', async () => {
    const postId = uuidv7();
    const existing = makeExistingPost(postId);

    const callOrder: string[] = [];
    vi.spyOn(repository, 'findById').mockImplementation(() => {
      callOrder.push('repository.findById');
      return Promise.resolve(existing);
    });
    vi.spyOn(repository, 'save').mockImplementation(() => {
      callOrder.push('repository.save');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ postId, tags: ['tag1'] });

    expect(callOrder).toEqual(['repository.findById', 'repository.save', 'dispatcher.dispatch']);
  });

  it('should throw PostNotFoundError when the post does not exist', async () => {
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(useCase.execute({ postId: uuidv7(), tags: ['tag1'] })).rejects.toThrow(
      PostNotFoundError,
    );
    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
