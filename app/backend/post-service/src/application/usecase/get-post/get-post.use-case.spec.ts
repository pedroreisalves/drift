import { uuidv7 } from 'uuidv7';
import GetPostUseCase from './get-post.use-case';
import Post from '../../../domain/post/entity/post.aggregate';
import { PostId, ClientId, type Logger } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

const makeRepository = (): PostRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  findAllFeatured: vi.fn().mockResolvedValue([]),
});

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makePost = (postId: string): Post => {
  const post = Post.create({
    id: new PostId(postId),
    clientId: new ClientId(uuidv7()),
    clientName: 'John Doe',
    title: 'Title',
    body: 'Body content.',
  });
  post.clearDomainEvents();
  return post;
};

describe('GetPostUseCase', () => {
  let repository: PostRepository;
  let useCase: GetPostUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new GetPostUseCase(repository, makeLogger());
  });

  it('should call repository.findById and return the post as a DTO', async () => {
    const postId = uuidv7();
    const existing = makePost(postId);
    const findByIdSpy = vi.spyOn(repository, 'findById').mockResolvedValue(existing);

    const result = await useCase.execute({ postId });

    expect(findByIdSpy).toHaveBeenCalledTimes(1);
    expect(findByIdSpy.mock.calls[0][0].toString()).toEqual(postId);
    expect(result.postId).toEqual(postId);
  });

  it('should throw PostNotFoundError when the post does not exist, without further calls', async () => {
    const findByIdSpy = vi.spyOn(repository, 'findById');

    await expect(useCase.execute({ postId: uuidv7() })).rejects.toThrow(PostNotFoundError);

    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should call repository.findById before returning the DTO', async () => {
    const postId = uuidv7();
    const existing = makePost(postId);
    const callOrder: string[] = [];

    vi.spyOn(repository, 'findById').mockImplementation(() => {
      callOrder.push('repository.findById');
      return Promise.resolve(existing);
    });

    await useCase.execute({ postId });

    expect(callOrder).toEqual(['repository.findById']);
  });
});
