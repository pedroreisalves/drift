import { truncateText, POST_BODY_PREVIEW_LENGTH } from '@drift/shared';
import type Post from '../../../domain/post/entity/post.aggregate';
import type { ListPostOutputDto } from './list-post.dto';

export function toListPostOutputDto(post: Post): ListPostOutputDto {
  return {
    postId: post.id.toString(),
    clientId: post.clientId.toString(),
    clientName: post.clientName,
    title: post.title,
    bodyPreview: truncateText(post.body, POST_BODY_PREVIEW_LENGTH),
    tags: post.tags,
    isFeatured: post.isFeatured,
    isTaggingInProgress: post.isTaggingInProgress,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}
