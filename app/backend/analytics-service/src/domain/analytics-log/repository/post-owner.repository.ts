import type { PostId, ClientId } from '@drift/shared';

export default interface PostOwnerRepository {
  save(postId: PostId, ownerClientId: ClientId): Promise<void>;
}
