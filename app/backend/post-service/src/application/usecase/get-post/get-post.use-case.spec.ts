import { uuidv7 } from 'uuidv7';
import GetPostUseCase from './get-post.use-case';
import Post from '../../../domain/post/entity/post.aggregate';
import { PostId } from '@drift/shared';
import { ClientId } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import { type Logger } from '@drift/shared';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

describe('GetPostUseCase', () => {
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

  it('should fetch the post from the repository and return it as a DTO', async () => {
    const repository = makeRepository();
    const useCase = new GetPostUseCase(repository, makeLogger());

    const postId = uuidv7();
    const existing = makePost(postId);
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    const result = await useCase.execute({ id: postId });

    expect(result.id).toEqual(postId);

    const findByIdMock = repository.findById as ReturnType<typeof vi.fn>;
    expect(findByIdMock).toHaveBeenCalledTimes(1);
    const fetchedId = findByIdMock.mock.calls[0][0] as PostId;
    expect(fetchedId.toString()).toEqual(postId);
  });

  it('should throw PostNotFoundError when the post does not exist', async () => {
    const repository = makeRepository();
    const useCase = new GetPostUseCase(repository, makeLogger());

    await expect(useCase.execute({ id: uuidv7() })).rejects.toThrow(PostNotFoundError);
  });
});
