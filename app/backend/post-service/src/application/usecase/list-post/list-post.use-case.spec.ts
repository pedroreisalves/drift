import { uuidv7 } from 'uuidv7';
import ListPostUseCase from './list-post.use-case';
import Post from '../../../domain/post/entity/post.aggregate';
import { PostId, ClientId, type Logger } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';

const makeRepository = (): PostRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
});

const makeLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const makePost = (postId = uuidv7()): Post => {
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

describe('ListPostUseCase', () => {
  let repository: PostRepository;
  let useCase: ListPostUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new ListPostUseCase(repository, makeLogger());
  });

  it('should return the posts fetched from the repository as DTOs', async () => {
    const firstId = uuidv7();
    const secondId = uuidv7();
    vi.spyOn(repository, 'findAll').mockResolvedValue([makePost(firstId), makePost(secondId)]);

    const result = await useCase.execute({ limit: 20, offset: 5 });

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(firstId);
    expect(result[1].id).toEqual(secondId);
  });

  it('should forward the provided limit and offset to the repository', async () => {
    const findAllSpy = vi.spyOn(repository, 'findAll');

    await useCase.execute({ limit: 20, offset: 5 });

    expect(findAllSpy).toHaveBeenCalledWith({ limit: 20, offset: 5 });
  });

  it('should default to limit 10 and offset 0 when both are omitted', async () => {
    const findAllSpy = vi.spyOn(repository, 'findAll');

    await useCase.execute({});

    expect(findAllSpy).toHaveBeenCalledWith({ limit: 10, offset: 0 });
  });

  it('should default only the omitted field when one is provided', async () => {
    const findAllSpy = vi.spyOn(repository, 'findAll');

    await useCase.execute({ limit: 50 });

    expect(findAllSpy).toHaveBeenCalledWith({ limit: 50, offset: 0 });
  });

  it('should call repository.findAll before returning results', async () => {
    const callOrder: string[] = [];
    vi.spyOn(repository, 'findAll').mockImplementation(() => {
      callOrder.push('repository.findAll');
      return Promise.resolve([]);
    });

    await useCase.execute({});

    expect(callOrder).toEqual(['repository.findAll']);
  });

});
