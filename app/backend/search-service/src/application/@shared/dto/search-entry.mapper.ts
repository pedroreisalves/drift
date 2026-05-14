import type SearchEntry from '../../../domain/search-entry/entity/search-entry.entity';
import type SearchEntryDTO from './search-entry.dto';

export default class SearchEntryMapper {
  static toDTO(entry: SearchEntry): SearchEntryDTO {
    return {
      postId: entry.postId.toString(),
      title: entry.title,
      body: entry.body,
      tags: entry.tags,
    };
  }
}
