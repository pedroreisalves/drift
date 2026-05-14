import { uuidv7 } from 'uuidv7';
import TagPostHandler from './tag-post.handler';
import TagPostCommand from './tag-post.command';
import TaggingProcess from '../../../domain/tagging-process/entity/tagging-process.aggregate';
import { PostId } from '@drift/shared';
import TaggingProcessId from '../../../domain/tagging-process/value-object/tagging-process-id.value-object';
import TaggingStatus from '../../../domain/tagging-process/value-object/tagging-status.value-object';
import type TaggingProcessRepository from '../../../domain/tagging-process/repository/tagging-process.repository';
import { type EventDispatcher } from '@drift/shared';
import { type Logger } from '@drift/shared';
import TaggingInitializedEvent from '../../../domain/tagging-process/event/tagging-initialized.event';

describe('TagPostHandler', () => {
  const makeRepository = (): TaggingProcessRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByPostId: vi.fn().mockResolvedValue(null),
  });

  const makeDispatcher = (): EventDispatcher => ({
    dispatch: vi.fn().mockResolvedValue(undefined),
  });

  const makeLogger = (): Logger => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const makeCommand = (postId = uuidv7()): TagPostCommand =>
    new TagPostCommand(postId, 'My Post Title', 'This is the post body content.');

  const makeExistingProcess = (
    status: 'initialized' | 'failed' | 'tagged' | 'abandoned',
  ): TaggingProcess => {
    const process = TaggingProcess.reconstruct({
      id: new TaggingProcessId(uuidv7()),
      postId: new PostId(uuidv7()),
      title: 'Title',
      body: 'Body',
      retryCount: 0,
      reason: null,
      status: new TaggingStatus(status),
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return process;
  };

  it('should create a tagging process, persist it, dispatch its events, and clear them', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new TagPostHandler(repository, dispatcher, makeLogger());

    await handler.execute(makeCommand());

    const saveMock = repository.save as ReturnType<typeof vi.fn>;
    const dispatchMock = dispatcher.dispatch as ReturnType<typeof vi.fn>;

    expect(saveMock).toHaveBeenCalledTimes(1);
    const persisted = saveMock.mock.calls[0][0] as TaggingProcess;
    expect(persisted).toBeInstanceOf(TaggingProcess);

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith(expect.any(TaggingInitializedEvent));

    expect(persisted.getDomainEvents()).toEqual([]);
  });

  it('should call repository.save before dispatcher.dispatch', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new TagPostHandler(repository, dispatcher, makeLogger());

    const callOrder: string[] = [];
    (repository.save as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('repository.save');
    });
    (dispatcher.dispatch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
    });

    await handler.execute(makeCommand());

    expect(callOrder).toEqual(['repository.save', 'dispatcher.dispatch']);
  });

  it('should skip creating a new process when an initialized one exists for the post', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new TagPostHandler(repository, dispatcher, makeLogger());

    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeExistingProcess('initialized'),
    );

    await handler.execute(makeCommand());

    expect(repository.save).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should skip creating a new process when a failed one exists for the post', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new TagPostHandler(repository, dispatcher, makeLogger());

    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeExistingProcess('failed'),
    );

    await handler.execute(makeCommand());

    expect(repository.save).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should create a new process when an existing one has status tagged', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new TagPostHandler(repository, dispatcher, makeLogger());

    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeExistingProcess('tagged'),
    );

    await handler.execute(makeCommand());

    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('should create a new process when an existing one has status abandoned', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const handler = new TagPostHandler(repository, dispatcher, makeLogger());

    (repository.findByPostId as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeExistingProcess('abandoned'),
    );

    await handler.execute(makeCommand());

    expect(repository.save).toHaveBeenCalledTimes(1);
  });
});
