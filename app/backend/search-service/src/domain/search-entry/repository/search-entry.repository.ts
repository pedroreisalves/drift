import type { PostId } from '@drift/shared';

import type SearchEntry from '../entity/search-entry.entity';

export default interface SearchEntryRepository {
  index(entry: SearchEntry): Promise<void>;
  update(entry: SearchEntry): Promise<void>;
  remove(postId: PostId): Promise<void>;
  findByPostId(postId: PostId): Promise<SearchEntry | null>;
  search(query: { q: string; limit: number; offset: number }): Promise<SearchEntry[]>;
}
