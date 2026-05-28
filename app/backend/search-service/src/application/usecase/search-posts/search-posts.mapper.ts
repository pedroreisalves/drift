import { truncateText, POST_BODY_PREVIEW_LENGTH } from '@drift/shared';
import type SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import type { SearchPostsOutputDto } from './search-posts.dto';

export function toSearchPostsOutputDto(entry: SearchEntry): SearchPostsOutputDto {
  return {
    postId: entry.postId.toString(),
    title: entry.title,
    bodyPreview: truncateText(entry.body, POST_BODY_PREVIEW_LENGTH),
    tags: entry.tags,
    isFeatured: entry.isFeatured,
    createdAt: entry.createdAt.toISOString(),
    isTaggingInProgress: entry.isTaggingInProgress,
  };
}
