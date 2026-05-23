import { uuidv7 } from 'uuidv7';
import { PostId } from '@drift/shared';
import SearchEntry, { type CreateSearchEntryProps } from './search-entry.entity';
import InvalidSearchEntryError from '../error/invalid-search-entry.error';

describe('SearchEntry', () => {
  const makeProps = (overrides: Partial<CreateSearchEntryProps> = {}): CreateSearchEntryProps => ({
    postId: new PostId(uuidv7()),
    title: 'My First Post',
    body: 'This is the body of my first post.',
    tags: ['tag1', 'tag2'],
    ...overrides,
  });

  it('should create a search entry', () => {
    const props = makeProps();

    const entry = SearchEntry.create(props);

    expect(entry).toBeInstanceOf(SearchEntry);
    expect(entry.postId).toEqual(props.postId);
    expect(entry.title).toEqual(props.title);
    expect(entry.body).toEqual(props.body);
    expect(entry.tags).toEqual(props.tags);
  });

  it('should throw an error when creating with an empty title', () => {
    const props = makeProps({ title: '' });

    expect(() => SearchEntry.create(props)).toThrow(InvalidSearchEntryError);
    expect(() => SearchEntry.create(props)).toThrow('Title cannot be empty');
  });

  it('should throw an error when creating with a title exceeding 45 characters', () => {
    const props = makeProps({ title: 'a'.repeat(46) });

    expect(() => SearchEntry.create(props)).toThrow(InvalidSearchEntryError);
    expect(() => SearchEntry.create(props)).toThrow('Title cannot exceed 45 characters');
  });

  it('should throw an error when creating with an empty body', () => {
    const props = makeProps({ body: '' });

    expect(() => SearchEntry.create(props)).toThrow(InvalidSearchEntryError);
    expect(() => SearchEntry.create(props)).toThrow('Body cannot be empty');
  });

  it('should throw an error when creating with a body exceeding 2000 characters', () => {
    const props = makeProps({ body: 'a'.repeat(2001) });

    expect(() => SearchEntry.create(props)).toThrow(InvalidSearchEntryError);
    expect(() => SearchEntry.create(props)).toThrow('Body cannot exceed 2000 characters');
  });

  it('should throw an error when creating with more than 10 tags', () => {
    const props = makeProps({ tags: Array.from({ length: 11 }, (_, i) => `tag${i}`) });

    expect(() => SearchEntry.create(props)).toThrow(InvalidSearchEntryError);
    expect(() => SearchEntry.create(props)).toThrow('Cannot have more than 10 tags');
  });

  it('should throw an error when creating with an empty tag', () => {
    const props = makeProps({ tags: [''] });

    expect(() => SearchEntry.create(props)).toThrow(InvalidSearchEntryError);
    expect(() => SearchEntry.create(props)).toThrow('Tag cannot be empty');
  });

  it('should throw an error when creating with a tag exceeding 45 characters', () => {
    const props = makeProps({ tags: ['a'.repeat(46)] });

    expect(() => SearchEntry.create(props)).toThrow(InvalidSearchEntryError);
    expect(() => SearchEntry.create(props)).toThrow('Tag cannot exceed 45 characters');
  });

  it('should throw an error when creating with duplicate tags', () => {
    const props = makeProps({ tags: ['tag', 'tag'] });

    expect(() => SearchEntry.create(props)).toThrow(InvalidSearchEntryError);
    expect(() => SearchEntry.create(props)).toThrow('Tags cannot be duplicated');
  });

  it('should reconstruct a search entry from existing properties', () => {
    const props = makeProps();

    const entry = SearchEntry.reconstruct(props);

    expect(entry).toBeInstanceOf(SearchEntry);
    expect(entry.postId).toEqual(props.postId);
    expect(entry.title).toEqual(props.title);
    expect(entry.body).toEqual(props.body);
    expect(entry.tags).toEqual(props.tags);
  });

  it('should update content and reset tags', () => {
    const entry = SearchEntry.create(makeProps());

    entry.updateContent({ title: 'Updated Title', body: 'Updated body.' });

    expect(entry.title).toEqual('Updated Title');
    expect(entry.body).toEqual('Updated body.');
    expect(entry.tags).toEqual([]);
  });

  it('should throw an error when updating content with an empty title', () => {
    const entry = SearchEntry.create(makeProps());

    expect(() => entry.updateContent({ title: '', body: 'Updated body.' })).toThrow(
      InvalidSearchEntryError,
    );
    expect(() => entry.updateContent({ title: '', body: 'Updated body.' })).toThrow(
      'Title cannot be empty',
    );
  });

  it('should throw an error when updating content with a title exceeding 45 characters', () => {
    const entry = SearchEntry.create(makeProps());

    expect(() => entry.updateContent({ title: 'a'.repeat(46), body: 'Updated body.' })).toThrow(
      InvalidSearchEntryError,
    );
    expect(() => entry.updateContent({ title: 'a'.repeat(46), body: 'Updated body.' })).toThrow(
      'Title cannot exceed 45 characters',
    );
  });

  it('should throw an error when updating content with an empty body', () => {
    const entry = SearchEntry.create(makeProps());

    expect(() => entry.updateContent({ title: 'Updated Title', body: '' })).toThrow(
      InvalidSearchEntryError,
    );
    expect(() => entry.updateContent({ title: 'Updated Title', body: '' })).toThrow(
      'Body cannot be empty',
    );
  });

  it('should throw an error when updating content with a body exceeding 2000 characters', () => {
    const entry = SearchEntry.create(makeProps());

    expect(() => entry.updateContent({ title: 'Updated Title', body: 'a'.repeat(2001) })).toThrow(
      InvalidSearchEntryError,
    );
    expect(() => entry.updateContent({ title: 'Updated Title', body: 'a'.repeat(2001) })).toThrow(
      'Body cannot exceed 2000 characters',
    );
  });

  it('should not mutate content when updateContent fails validation', () => {
    const props = makeProps();
    const entry = SearchEntry.create(props);

    expect(() => entry.updateContent({ title: '', body: '' })).toThrow(InvalidSearchEntryError);

    expect(entry.title).toEqual(props.title);
    expect(entry.body).toEqual(props.body);
  });

  it('should update tags', () => {
    const entry = SearchEntry.create(makeProps());

    entry.updateTags({ tags: ['newTag1', 'newTag2'] });

    expect(entry.tags).toEqual(['newTag1', 'newTag2']);
  });

  it('should throw an error when updating with more than 10 tags', () => {
    const entry = SearchEntry.create(makeProps());
    const tooManyTags = Array.from({ length: 11 }, (_, i) => `tag${i}`);

    expect(() => entry.updateTags({ tags: tooManyTags })).toThrow(InvalidSearchEntryError);
    expect(() => entry.updateTags({ tags: tooManyTags })).toThrow('Cannot have more than 10 tags');
  });

  it('should throw an error when updating with an empty tag', () => {
    const entry = SearchEntry.create(makeProps());

    expect(() => entry.updateTags({ tags: [''] })).toThrow(InvalidSearchEntryError);
    expect(() => entry.updateTags({ tags: [''] })).toThrow('Tag cannot be empty');
  });

  it('should throw an error when updating with a tag exceeding 45 characters', () => {
    const entry = SearchEntry.create(makeProps());

    expect(() => entry.updateTags({ tags: ['a'.repeat(46)] })).toThrow(InvalidSearchEntryError);
    expect(() => entry.updateTags({ tags: ['a'.repeat(46)] })).toThrow(
      'Tag cannot exceed 45 characters',
    );
  });

  it('should throw an error when updating with duplicate tags', () => {
    const entry = SearchEntry.create(makeProps());

    expect(() => entry.updateTags({ tags: ['tag', 'tag'] })).toThrow(InvalidSearchEntryError);
    expect(() => entry.updateTags({ tags: ['tag', 'tag'] })).toThrow('Tags cannot be duplicated');
  });

  it('should not mutate tags when updateTags fails validation', () => {
    const props = makeProps();
    const entry = SearchEntry.create(props);

    expect(() => entry.updateTags({ tags: ['tag', 'tag'] })).toThrow(InvalidSearchEntryError);

    expect(entry.tags).toEqual(props.tags);
  });
});
