import { uuidv7 } from 'uuidv7';
import TagPostUseCase from './tag-post.use-case';
import TaggingProcess from '../../../domain/tagging-process/entity/tagging-process.aggregate';
import { PostId } from '@drift/shared';
import TaggingProcessId from '../../../domain/tagging-process/value-object/tagging-process-id.value-object';
import { TaggingStatusEnum } from '../../../domain/tagging-process/value-object/tagging-status.value-object';
import type TaggingProcessRepository from '../../../domain/tagging-process/repository/tagging-process.repository';
import { type EventDispatcher, type Logger } from '@drift/shared';
import TaggingInitializedEvent from '../../../domain/tagging-process/event/tagging-initialized.event';
import TaggingStatus from '../../../domain/tagging-process/value-object/tagging-status.value-object';
import type { TagPostInputDto } from './tag-post.input-dto';

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

const makeInput = (postId = uuidv7()): TagPostInputDto => ({
  postId,
  title: 'My Post Title',
  body: 'This is the post body content.',
});

const makeExistingProcess = (status: TaggingStatusEnum): TaggingProcess =>
  TaggingProcess.reconstruct({
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

describe('TagPostUseCase', () => {
  let repository: TaggingProcessRepository;
  let dispatcher: EventDispatcher;
  let useCase: TagPostUseCase;

  beforeEach(() => {
    repository = makeRepository();
    dispatcher = makeDispatcher();
    useCase = new TagPostUseCase(repository, dispatcher, makeLogger());
  });

  it('should create a tagging process, persist it, dispatch its events, and clear them', async () => {
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute(makeInput());

    expect(saveSpy).toHaveBeenCalledTimes(1);
    // instance-reference check: persisted object is a TaggingProcess
    expect(saveSpy.mock.calls[0][0]).toBeInstanceOf(TaggingProcess);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(TaggingInitializedEvent));

    expect(saveSpy.mock.calls[0][0].getDomainEvents()).toEqual([]);
  });

  it('should call repository.save before dispatcher.dispatch', async () => {
    const callOrder: string[] = [];
    vi.spyOn(repository, 'save').mockImplementation(() => {
      callOrder.push('repository.save');
      return Promise.resolve();
    });
    vi.spyOn(dispatcher, 'dispatch').mockImplementation(() => {
      callOrder.push('dispatcher.dispatch');
      return Promise.resolve();
    });

    await useCase.execute(makeInput());

    expect(callOrder).toEqual(['repository.save', 'dispatcher.dispatch']);
  });

  it('should skip creating a new process when an initialized one exists for the post', async () => {
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(
      makeExistingProcess(TaggingStatusEnum.initialized),
    );
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute(makeInput());

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should skip creating a new process when a failed one exists for the post', async () => {
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(
      makeExistingProcess(TaggingStatusEnum.failed),
    );
    const saveSpy = vi.spyOn(repository, 'save');
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');

    await useCase.execute(makeInput());

    expect(saveSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should create a new process when an existing one has status tagged', async () => {
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(
      makeExistingProcess(TaggingStatusEnum.tagged),
    );
    const saveSpy = vi.spyOn(repository, 'save');

    await useCase.execute(makeInput());

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should create a new process when an existing one has status abandoned', async () => {
    vi.spyOn(repository, 'findByPostId').mockResolvedValue(
      makeExistingProcess(TaggingStatusEnum.abandoned),
    );
    const saveSpy = vi.spyOn(repository, 'save');

    await useCase.execute(makeInput());

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
});
