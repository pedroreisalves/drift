import { ClientId, type Logger, PostId, sha256Hex } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import Post from '../../../domain/post/entity/post.aggregate';
import type PostRepository from '../../../domain/post/repository/post.repository';
import PostNotFoundError from '../../@shared/error/post-not-found.error';
import GetPostUseCase from './get-post.use-case';

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
    expect(result.body).toBe('Body content.');
    expect(result.isFeatured).toBe(false);
    expect(result.isTaggingInProgress).toBe(false);
    expect(result.clientHash).toBe(sha256Hex(existing.clientId.toString()));
    expect(result).not.toHaveProperty('clientId');
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
