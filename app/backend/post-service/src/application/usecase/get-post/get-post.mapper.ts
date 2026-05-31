import { sha256Hex } from '@drift/shared';

import type Post from '../../../domain/post/entity/post.aggregate';
import type { GetPostOutputDto } from './get-post.dto';

export function toGetPostOutputDto(post: Post): GetPostOutputDto {
  return {
    postId: post.id.toString(),
    clientHash: sha256Hex(post.clientId.toString()),
    clientName: post.clientName,
    title: post.title,
    body: post.body,
    tags: post.tags,
    isFeatured: post.isFeatured,
    isTaggingInProgress: post.isTaggingInProgress,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}
