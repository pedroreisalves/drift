import { type EventDispatcher } from '@drift/shared';
import type TaggingProcessRepository from '../../../domain/tagging-process/repository/tagging-process.repository';
import { PostId } from '@drift/shared';
import type { TagPostInputDto } from './tag-post.input-dto';
import TaggingProcess from '../../../domain/tagging-process/entity/tagging-process.aggregate';
import TaggingProcessId from '../../../domain/tagging-process/value-object/tagging-process-id.value-object';
import { uuidv7 } from 'uuidv7';
import { type Logger } from '@drift/shared';

export default class TagPostUseCase {
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

    const events = taggingProcess.getDomainEvents();

    for (const event of events) {
      await this.eventDispatcher.dispatch(event);
    }

    taggingProcess.clearDomainEvents();
  }
}
