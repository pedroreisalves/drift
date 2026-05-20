import type { PostId } from '@drift/shared';
import { z } from 'zod';
import InvalidSearchEntryError from '../error/invalid-search-entry.error';

export interface SearchEntryProps {
  postId: PostId;
  title: string;
  body: string;
  tags: string[];
}

interface CreateSearchEntryProps {
  postId: PostId;
  title: string;
  body: string;
  tags: string[];
}

const createSearchEntrySchema = z
  .object({
    title: z
      .string()
      .nonempty('Title cannot be empty')
      .max(45, 'Title cannot exceed 45 characters'),
    body: z
      .string()
      .nonempty('Body cannot be empty')
      .max(2000, 'Body cannot exceed 2000 characters'),
    tags: z
      .array(z.string().max(45, 'Tag cannot exceed 45 characters').nonempty('Tag cannot be empty'))
      .max(10, 'Cannot have more than 10 tags')
      .refine((tags) => new Set(tags).size === tags.length, {
        message: 'Tags cannot be duplicated',
      }),
  })
  .strict();

interface UpdateSearchEntryContentProps {
  title: string;
  body: string;
}

const updateSearchEntryContentSchema = z
  .object({
    title: z
      .string()
      .nonempty('Title cannot be empty')
      .max(45, 'Title cannot exceed 45 characters'),
    body: z
      .string()
      .nonempty('Body cannot be empty')
      .max(2000, 'Body cannot exceed 2000 characters'),
  })
  .strict();

interface UpdateSearchEntryTagsProps {
  tags: string[];
}

const updateSearchEntryTagsSchema = z
  .object({
    tags: z
      .array(z.string().max(45, 'Tag cannot exceed 45 characters').nonempty('Tag cannot be empty'))
      .max(10, 'Cannot have more than 10 tags')
      .refine((tags) => new Set(tags).size === tags.length, {
        message: 'Tags cannot be duplicated',
      }),
  })
  .strict();

export default class SearchEntry {
  private constructor(private props: SearchEntryProps) {}

  static reconstruct(props: SearchEntryProps): SearchEntry {
    return new SearchEntry(props);
  }

  static create(props: CreateSearchEntryProps): SearchEntry {
    const result = createSearchEntrySchema.safeParse({
      title: props.title,
      body: props.body,
      tags: props.tags,
    });

    if (!result.success) {
      throw new InvalidSearchEntryError(result.error.issues.map((e) => e.message));
    }

    const searchEntry = new SearchEntry({ ...props });

    return searchEntry;
  }

  updateContent(props: UpdateSearchEntryContentProps): void {
    const result = updateSearchEntryContentSchema.safeParse({
      title: props.title,
      body: props.body,
    });

    if (!result.success) {
      throw new InvalidSearchEntryError(result.error.issues.map((e) => e.message));
    }

    this.props.title = props.title;
    this.props.body = props.body;
  }

  updateTags(props: UpdateSearchEntryTagsProps): void {
    const result = updateSearchEntryTagsSchema.safeParse({
      tags: props.tags,
    });

    if (!result.success) {
      throw new InvalidSearchEntryError(result.error.issues.map((e) => e.message));
    }

    this.props.tags = props.tags;
  }

  get postId(): PostId {
    return this.props.postId;
  }

  get title(): string {
    return this.props.title;
  }

  get body(): string {
    return this.props.body;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }
}
