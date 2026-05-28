import type { PostId } from '@drift/shared';
import type EngagementState from '../entity/engagement-state.entity';

export interface FindAllRaisedOptions {
  excludeDeleted?: boolean;
}

export default interface EngagementStateRepository {
  save(state: EngagementState): Promise<void>;
  saveMany(states: EngagementState[]): Promise<void>;
  findByPostIds(postIds: PostId[]): Promise<EngagementState[]>;
  findAllRaised(options?: FindAllRaisedOptions): Promise<EngagementState[]>;
}
