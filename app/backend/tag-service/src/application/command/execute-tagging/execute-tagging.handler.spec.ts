import { uuidv7 } from 'uuidv7';
import ExecuteTaggingHandler from './execute-tagging.handler';
import ExecuteTaggingCommand from './execute-tagging.command';
import TaggingProcess from '../../../domain/tagging-process/entity/tagging-process.aggregate';
import { PostId } from '@drift/shared';
import TaggingProcessId from '../../../domain/tagging-process/value-object/tagging-process-id.value-object';
import TaggingStatus, { TaggingStatusEnum } from '../../../domain/tagging-process/value-object/tagging-status.value-object';
import type TaggingProcessRepository from '../../../domain/tagging-process/repository/tagging-process.repository';
import { type EventDispatcher } from '@drift/shared';
import type TagGenerator from '../../@shared/interface/tag-generator.interface';
import { type Logger } from '@drift/shared';
import TaggingProcessNotFoundError from '../../@shared/error/tagging-process-not-found.error';
import PostTaggedEvent from '../../../domain/tagging-process/event/post-tagged.event';
import TaggingFailedEvent from '../../../domain/tagging-process/event/tagging-failed.event';
import TaggingAbandonedEvent from '../../../domain/tagging-process/event/tagging-abandoned.event';

describe('ExecuteTaggingHandler', () => {
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

  const makeTagGenerator = (tags: string[] = ['tech', 'news']): TagGenerator => ({
    generateTags: vi.fn().mockResolvedValue(tags),
  });

  const makeExistingProcess = (overrides: { retryCount?: number } = {}): TaggingProcess => {
    const process = TaggingProcess.reconstruct({
      id: new TaggingProcessId(uuidv7()),
      postId: new PostId(uuidv7()),
      title: 'My Post Title',
      body: 'This is the post body content.',
      retryCount: overrides.retryCount ?? 0,
      reason: null,
      status: new TaggingStatus(TaggingStatusEnum.initialized),
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return process;
  };

  it('should fetch the process, generate tags, persist it, dispatch PostTaggedEvent, and clear events', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const tagGenerator = makeTagGenerator(['tech', 'news']);
    const handler = new ExecuteTaggingHandler(repository, dispatcher, tagGenerator, makeLogger());

    const process = makeExistingProcess();
    const taggingProcessId = process.id.toString();
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(process);

    await handler.execute(new ExecuteTaggingCommand(taggingProcessId));

    const saveMock = repository.save as ReturnType<typeof vi.fn>;
    const dispatchMock = dispatcher.dispatch as ReturnType<typeof vi.fn>;

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock.mock.calls[0][0]).toBe(process);

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith(expect.any(PostTaggedEvent));

    expect(process.getDomainEvents()).toEqual([]);
  });

  it('should call findById, then repository.save, then dispatcher.dispatch in order', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const tagGenerator = makeTagGenerator();
    const handler = new ExecuteTaggingHandler(repository, dispatcher, tagGenerator, makeLogger());

    const process = makeExistingProcess();
    const callOrder: string[] = [];

    (repository.findById as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('repository.findById');
      return process;
    });
    (repository.save as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('repository.save');
    });
    (dispatcher.dispatch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
    });

    await handler.execute(new ExecuteTaggingCommand(process.id.toString()));

    expect(callOrder).toEqual(['repository.findById', 'repository.save', 'dispatcher.dispatch']);
  });

  it('should throw TaggingProcessNotFoundError when the process does not exist', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const tagGenerator = makeTagGenerator();
    const handler = new ExecuteTaggingHandler(repository, dispatcher, tagGenerator, makeLogger());

    await expect(handler.execute(new ExecuteTaggingCommand(uuidv7()))).rejects.toThrow(
      TaggingProcessNotFoundError,
    );

    expect(repository.save).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should call process.fail with the stringified value when tag generation throws a non-Error', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const tagGenerator: TagGenerator = {
      generateTags: vi.fn().mockRejectedValue('raw string error'),
    };
    const handler = new ExecuteTaggingHandler(repository, dispatcher, tagGenerator, makeLogger());

    const process = makeExistingProcess();
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(process);

    const failSpy = vi.spyOn(process, 'fail');

    await handler.execute(new ExecuteTaggingCommand(process.id.toString()));

    expect(failSpy).toHaveBeenCalledWith({ reason: 'raw string error' });
  });

  it('should call process.fail with the error message and dispatch TaggingFailedEvent when tag generation throws', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const errorMessage = 'AI service unavailable';
    const tagGenerator: TagGenerator = {
      generateTags: vi.fn().mockRejectedValue(new Error(errorMessage)),
    };
    const handler = new ExecuteTaggingHandler(repository, dispatcher, tagGenerator, makeLogger());

    const process = makeExistingProcess();
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(process);

    const failSpy = vi.spyOn(process, 'fail');

    await handler.execute(new ExecuteTaggingCommand(process.id.toString()));

    expect(failSpy).toHaveBeenCalledWith({ reason: errorMessage });
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(expect.any(TaggingFailedEvent));
    expect(process.getDomainEvents()).toEqual([]);
  });

  it('should call process.fail with the error message and dispatch TaggingAbandonedEvent when tag generation fails and retry count is exhausted', async () => {
    const repository = makeRepository();
    const dispatcher = makeDispatcher();
    const errorMessage = 'AI service unavailable';
    const tagGenerator: TagGenerator = {
      generateTags: vi.fn().mockRejectedValue(new Error(errorMessage)),
    };
    const handler = new ExecuteTaggingHandler(repository, dispatcher, tagGenerator, makeLogger());

    const process = makeExistingProcess({ retryCount: 3 });
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(process);

    const failSpy = vi.spyOn(process, 'fail');

    await handler.execute(new ExecuteTaggingCommand(process.id.toString()));

    expect(failSpy).toHaveBeenCalledWith({ reason: errorMessage });
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(expect.any(TaggingAbandonedEvent));
    expect(process.getDomainEvents()).toEqual([]);
  });
});
