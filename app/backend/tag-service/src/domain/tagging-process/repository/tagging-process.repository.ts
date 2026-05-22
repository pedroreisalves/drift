import type TaggingProcess from '../entity/tagging-process.aggregate';
import type { PostId } from '@drift/shared';
import type TaggingProcessId from '../value-object/tagging-process-id.value-object';

export default interface TaggingProcessRepository {
  findById(taggingProcessId: TaggingProcessId): Promise<TaggingProcess | null>;
  findByPostId(postId: PostId): Promise<TaggingProcess | null>;
  save(taggingProcess: TaggingProcess): Promise<void>;
}
