import type { ClientHash, PostId } from '@drift/shared';

export default interface PostOwnerRepository {
  save(postId: PostId, ownerClientHash: ClientHash): Promise<void>;
}
