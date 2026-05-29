import { type EventDispatcher, type Logger, PostId, type UseCase } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import TaggingProcess from '../../../domain/tagging-process/entity/tagging-process.aggregate';
import type TaggingProcessRepository from '../../../domain/tagging-process/repository/tagging-process.repository';
import TaggingProcessId from '../../../domain/tagging-process/value-object/tagging-process-id.value-object';
import type { TagPostInputDto } from './tag-post.dto';

export default class TagPostUseCase implements UseCase<TagPostInputDto, void> {
  constructor(
    private readonly taggingProcessRepository: TaggingProcessRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: TagPostInputDto): Promise<void> {
    const postId = new PostId(input.postId);

    const existing = await this.taggingProcessRepository.findByPostId(postId);

    if (existing?.isInProgress) {
      this.logger.info('Tagging already in progress, skipping', {
        postId: postId.toString(),
        existingStatus: existing.status.toString(),
      });
      return;
    }

    const id = new TaggingProcessId(uuidv7());

    const taggingProcess = TaggingProcess.create({
      id,
      postId,
      title: input.title,
      body: input.body,
    });

    await this.taggingProcessRepository.save(taggingProcess);

    this.logger.info('Tagging process created', {
      taggingProcessId: id.toString(),
      postId: postId.toString(),
    });

    for (const event of taggingProcess.getDomainEvents()) {
      await this.eventDispatcher.dispatch(event);
    }

    taggingProcess.clearDomainEvents();
  }
}
