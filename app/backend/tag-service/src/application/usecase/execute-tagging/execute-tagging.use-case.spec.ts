import { uuidv7 } from 'uuidv7';
import ExecuteTaggingUseCase from './execute-tagging.use-case';
import TaggingProcess from '../../../domain/tagging-process/entity/tagging-process.aggregate';
import { PostId } from '@drift/shared';
import TaggingProcessId from '../../../domain/tagging-process/value-object/tagging-process-id.value-object';
import TaggingStatus, {
  TaggingStatusEnum,
} from '../../../domain/tagging-process/value-object/tagging-status.value-object';
import type TaggingProcessRepository from '../../../domain/tagging-process/repository/tagging-process.repository';
import { type EventDispatcher, type Logger } from '@drift/shared';
import type TagGenerator from '../../@shared/interface/tag-generator.interface';
import TaggingProcessNotFoundError from '../../@shared/error/tagging-process-not-found.error';
import PostTaggedEvent from '../../../domain/tagging-process/event/post-tagged.event';
import TaggingFailedEvent from '../../../domain/tagging-process/event/tagging-failed.event';
import TaggingAbandonedEvent from '../../../domain/tagging-process/event/tagging-abandoned.event';

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

const makeExistingProcess = (overrides: { retryCount?: number } = {}): TaggingProcess =>
  TaggingProcess.reconstruct({
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

describe('ExecuteTaggingUseCase', () => {
  let repository: TaggingProcessRepository;
  let dispatcher: EventDispatcher;
  let tagGenerator: TagGenerator;
  let useCase: ExecuteTaggingUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    tagGenerator = makeTagGenerator(['tech', 'news']);
    useCase = new ExecuteTaggingUseCase(repository, tagGenerator, dispatcher, makeLogger());
  });

  it('should fetch the process, generate tags, persist it, dispatch PostTaggedEvent, and clear events', async () => {
    const process = makeExistingProcess();
    vi.spyOn(repository, 'findById').mockResolvedValue(process);
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute({ taggingProcessId: process.id.toString() });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy.mock.calls[0][0]).toBe(process);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PostTaggedEvent));

    expect(process.getDomainEvents()).toEqual([]);
  });

  it('should call findById, then repository.save, then dispatcher.dispatch in order', async () => {
    const process = makeExistingProcess();
    const callOrder: string[] = [];

    vi.spyOn(repository, 'findById').mockImplementation(() => {
      callOrder.push('repository.findById');
      return Promise.resolve(process);
    });
    vi.spyOn(repository, 'save').mockImplementation(() => {
      callOrder.push('repository.save');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute({ taggingProcessId: process.id.toString() });

    expect(callOrder).toEqual(['repository.findById', 'repository.save', 'dispatcher.dispatch']);
  });

  it('should throw TaggingProcessNotFoundError when the process does not exist', async () => {
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await expect(useCase.execute({ taggingProcessId: uuidv7() })).rejects.toThrow(
      TaggingProcessNotFoundError,
    );

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should call process.fail with the stringified value when tag generation throws a non-Error', async () => {
    const process = makeExistingProcess();
    vi.spyOn(repository, 'findById').mockResolvedValue(process);
    vi.spyOn(tagGenerator, 'generateTags').mockRejectedValue('raw string error');
    const failSpy = vi.spyOn(process, 'fail');

    await useCase.execute({ taggingProcessId: process.id.toString() });

    expect(failSpy).toHaveBeenCalledWith({ reason: 'raw string error' });
  });

  it('should call process.fail with the error message and dispatch TaggingFailedEvent when tag generation throws', async () => {
    const errorMessage = 'AI service unavailable';
    const process = makeExistingProcess();
    vi.spyOn(repository, 'findById').mockResolvedValue(process);
    vi.spyOn(tagGenerator, 'generateTags').mockRejectedValue(new Error(errorMessage));
    const failSpy = vi.spyOn(process, 'fail');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');
    const saveSpy = vi.spyOn(repository, 'save');

    await useCase.execute({ taggingProcessId: process.id.toString() });

    expect(failSpy).toHaveBeenCalledWith({ reason: errorMessage });
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(TaggingFailedEvent));
    expect(process.getDomainEvents()).toEqual([]);
  });

  it('should call process.fail with the error message and dispatch TaggingAbandonedEvent when tag generation fails and retry count is exhausted', async () => {
    const errorMessage = 'AI service unavailable';
    const process = makeExistingProcess({ retryCount: 3 });
    vi.spyOn(repository, 'findById').mockResolvedValue(process);
    vi.spyOn(tagGenerator, 'generateTags').mockRejectedValue(new Error(errorMessage));
    const failSpy = vi.spyOn(process, 'fail');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');
    const saveSpy = vi.spyOn(repository, 'save');

    await useCase.execute({ taggingProcessId: process.id.toString() });

    expect(failSpy).toHaveBeenCalledWith({ reason: errorMessage });
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(TaggingAbandonedEvent));
    expect(process.getDomainEvents()).toEqual([]);
  });
});
