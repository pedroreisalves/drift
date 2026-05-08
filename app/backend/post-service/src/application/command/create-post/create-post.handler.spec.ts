import { uuidv7 } from 'uuidv7';
import CreatePostHandler from './create-post.handler';
import CreatePostCommand from './create-post.command';
import Post from '../../../domain/post/entity/post.aggregate';
import type PostRepository from '../../../domain/post/repository/post.repository';
import type EventDispatcher from '../../@shared/interface/event-dispatcher.interface';
import PostCreatedEvent from '../../../domain/post/event/post-created.event';

describe('CreatePostHandler', () => {
  const makeRepository = (): PostRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
  });

  const makeDispatcher = (): EventDispatcher => ({
    dispatch: vi.fn().mockResolvedValue(undefined),
  });

  it('should persist the created post, dispatch its events, clear them and return the post id', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new CreatePostHandler(repository, dispatcher);

    const command = new CreatePostCommand(
      uuidv7(),
      'John Doe',
      'My First Post',
      'This is the body of my first post.',
    );

    const postId = await handler.execute(command);

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
    const handler = new CreatePostHandler(repository, dispatcher);

    const callOrder: string[] = [];
    (repository.save as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('repository.save');
    });
    (dispatcher.dispatch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
    });

    await handler.execute(
      new CreatePostCommand(uuidv7(), 'John Doe', 'My First Post', 'Body content.'),
    );

    expect(callOrder).toEqual(['repository.save', 'dispatcher.dispatch']);
  });
});
