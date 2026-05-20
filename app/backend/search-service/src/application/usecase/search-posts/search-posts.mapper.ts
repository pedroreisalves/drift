import type SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import type SearchPostsOutputDto from './search-posts.output-dto';

export default class SearchPostsMapper {
  static toOutputDto(entry: SearchEntry): SearchPostsOutputDto {
    return {
      postId: entry.postId.toString(),
      title: entry.title,
      body: entry.body,
      tags: entry.tags,
    };
  }
}
