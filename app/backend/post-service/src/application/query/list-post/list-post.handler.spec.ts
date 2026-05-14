import { uuidv7 } from 'uuidv7';
import ListPostHandler from './list-post.handler';
import ListPostQuery from './list-post.query';
import Post from '../../../domain/post/entity/post.aggregate';
import { PostId } from '@drift/shared';
import { ClientId } from '@drift/shared';
import type PostRepository from '../../../domain/post/repository/post.repository';
import { type Logger } from '@drift/shared';

describe('ListPostHandler', () => {
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

  it('should return the posts fetched from the repository as DTOs', async () => {
    const repository = makeRepository();
    const handler = new ListPostHandler(repository, makeLogger());

    const firstId = uuidv7();
    const secondId = uuidv7();
    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
      makePost(firstId),
      makePost(secondId),
    ]);

    const result = await handler.execute(new ListPostQuery(20, 5));

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(firstId);
    expect(result[1].id).toEqual(secondId);
  });

  it('should forward the provided limit and offset to the repository', async () => {
    const repository = makeRepository();
    const handler = new ListPostHandler(repository, makeLogger());

    await handler.execute(new ListPostQuery(20, 5));

    const findAllMock = repository.findAll as ReturnType<typeof vi.fn>;
    expect(findAllMock).toHaveBeenCalledWith({ limit: 20, offset: 5 });
  });

  it('should default to limit 10 and offset 0 when both are omitted', async () => {
    const repository = makeRepository();
    const handler = new ListPostHandler(repository, makeLogger());

    await handler.execute(new ListPostQuery());

    const findAllMock = repository.findAll as ReturnType<typeof vi.fn>;
    expect(findAllMock).toHaveBeenCalledWith({ limit: 10, offset: 0 });
  });

  it('should default only the omitted field when one is provided', async () => {
    const repository = makeRepository();
    const handler = new ListPostHandler(repository, makeLogger());

    await handler.execute(new ListPostQuery(50));

    const findAllMock = repository.findAll as ReturnType<typeof vi.fn>;
    expect(findAllMock).toHaveBeenCalledWith({ limit: 50, offset: 0 });
  });
});
