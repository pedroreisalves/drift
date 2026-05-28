import { type Meilisearch, MeilisearchApiError, type Index } from 'meilisearch';
import { PostId } from '@drift/shared';
import type SearchEntryRepository from '../../domain/search-entry/repository/search-entry.repository';
import SearchEntry from '../../domain/search-entry/entity/search-entry.entity';

interface SearchEntryDocument {
  id: string;
  title: string;
  body: string;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
  isTaggingInProgress: boolean;
}

export default class MeilisearchSearchEntryRepository implements SearchEntryRepository {
  private readonly meiliIndex: Index<SearchEntryDocument>;

  constructor(client: Meilisearch) {
    this.meiliIndex = client.index<SearchEntryDocument>('posts');
  }

  async index(entry: SearchEntry): Promise<void> {
    await this.meiliIndex.addDocuments([this.toDocument(entry)]);
  }

  async update(entry: SearchEntry): Promise<void> {
    await this.meiliIndex.updateDocuments([this.toDocument(entry)]);
  }

  async remove(postId: PostId): Promise<void> {
    await this.meiliIndex.deleteDocument(postId.toString());
  }

  async findByPostId(postId: PostId): Promise<SearchEntry | null> {
    try {
      const doc = await this.meiliIndex.getDocument(postId.toString());
      return this.toDomain(doc);
    } catch (error) {
      if (error instanceof MeilisearchApiError && error.cause?.code === 'document_not_found') {
        return null;
      }
      throw error;
    }
  }

  async search(query: { q: string; limit: number; offset: number }): Promise<SearchEntry[]> {
    const result = await this.meiliIndex.search(query.q, {
      limit: query.limit,
      offset: query.offset,
    });
    return result.hits.map((hit) => this.toDomain(hit));
  }

  private toDocument(entry: SearchEntry): SearchEntryDocument {
    return {
      id: entry.postId.toString(),
      title: entry.title,
      body: entry.body,
      tags: entry.tags,
      isFeatured: entry.isFeatured,
      createdAt: entry.createdAt.toISOString(),
      isTaggingInProgress: entry.isTaggingInProgress,
    };
  }

  private toDomain(doc: SearchEntryDocument): SearchEntry {
    return SearchEntry.reconstruct({
      postId: new PostId(doc.id),
      title: doc.title,
      body: doc.body,
      tags: doc.tags,
      isFeatured: doc.isFeatured,
      createdAt: new Date(doc.createdAt),
      isTaggingInProgress: doc.isTaggingInProgress,
    });
  }
}
