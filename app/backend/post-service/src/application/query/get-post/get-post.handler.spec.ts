import { uuidv7 } from 'uuidv7';
import GetPostHandler from './get-post.handler';
import GetPostQuery from './get-post.query';
import Post from '../../../domain/post/entity/post.aggregate';
import PostId from '../../../domain/post/value-object/post-id.value-object';
import ClientId from '../../../domain/post/value-object/client-id.value-object';
import type PostRepository from '../../../domain/post/repository/post.repository';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

describe('GetPostHandler', () => {
  const makeRepository = (): PostRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
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
    const handler = new GetPostHandler(repository);

    const postId = uuidv7();
    const existing = makePost(postId);
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    const result = await handler.execute(new GetPostQuery(postId));

    expect(result.id).toEqual(postId);

    const findByIdMock = repository.findById as ReturnType<typeof vi.fn>;
    expect(findByIdMock).toHaveBeenCalledTimes(1);
    const fetchedId = findByIdMock.mock.calls[0][0] as PostId;
    expect(fetchedId.toString()).toEqual(postId);
  });

  it('should throw PostNotFoundError when the post does not exist', async () => {
    const repository = makeRepository();
    const handler = new GetPostHandler(repository);

    await expect(handler.execute(new GetPostQuery(uuidv7()))).rejects.toThrow(PostNotFoundError);
  });
});
