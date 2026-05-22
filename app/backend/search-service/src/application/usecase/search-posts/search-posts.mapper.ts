import type SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import type { SearchPostsOutputDto } from './search-posts.dto';

export function toSearchPostsOutputDto(entry: SearchEntry): SearchPostsOutputDto {
  return {
    postId: entry.postId.toString(),
    title: entry.title,
    body: entry.body,
    tags: entry.tags,
  };
}
