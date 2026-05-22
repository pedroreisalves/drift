import { type EventDispatcher, type Logger, type UseCase } from '@drift/shared';
import type TaggingProcessRepository from '../../../domain/tagging-process/repository/tagging-process.repository';
import type { ExecuteTaggingInputDto } from './execute-tagging.dto';
import type TagGenerator from '../../@shared/interface/tag-generator.interface';
import TaggingProcessNotFoundError from '../../@shared/error/tagging-process-not-found.error';
import TaggingProcessId from '../../../domain/tagging-process/value-object/tagging-process-id.value-object';

export default class ExecuteTaggingUseCase implements UseCase<ExecuteTaggingInputDto, void> {
  constructor(
    private readonly taggingProcessRepository: TaggingProcessRepository,
    private readonly tagGenerator: TagGenerator,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: ExecuteTaggingInputDto): Promise<void> {
    const taggingProcessId = new TaggingProcessId(input.taggingProcessId);

    const taggingProcess = await this.taggingProcessRepository.findById(taggingProcessId);

    if (!taggingProcess) {
      this.logger.error('Tagging process not found', {
        taggingProcessId: taggingProcessId.toString(),
      });
      throw new TaggingProcessNotFoundError(taggingProcessId.toString());
    }

    try {
      this.logger.info('Starting tag generation', {
        taggingProcessId: taggingProcessId.toString(),
        postId: taggingProcess.postId.toString(),
      });

      const tags = await this.tagGenerator.generateTags(taggingProcess.title, taggingProcess.body);
      taggingProcess.succeed({ tags });

      this.logger.info('Tag generation succeeded', {
        taggingProcessId: taggingProcessId.toString(),
        postId: taggingProcess.postId.toString(),
        tags,
        tagCount: tags.length,
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      taggingProcess.fail({ reason });

      if (taggingProcess.isAbandoned) {
        this.logger.warn('Tagging abandoned after max retries', {
          taggingProcessId: taggingProcessId.toString(),
          postId: taggingProcess.postId.toString(),
          retryCount: taggingProcess.retryCount,
          reason,
        });
      } else {
        this.logger.error('Tag generation failed, will retry', {
          taggingProcessId: taggingProcessId.toString(),
          postId: taggingProcess.postId.toString(),
          retryCount: taggingProcess.retryCount,
          reason,
        });
      }
    }

    await this.taggingProcessRepository.save(taggingProcess);

    for (const event of taggingProcess.getDomainEvents()) {
      await this.eventDispatcher.dispatch(event);
    }

    taggingProcess.clearDomainEvents();
  }
}
