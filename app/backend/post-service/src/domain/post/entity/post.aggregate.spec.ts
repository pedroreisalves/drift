import { uuidv7 } from 'uuidv7';
import PostId from '../value-object/post-id.value-object';
import ClientId from '../value-object/client-id.value-object';
import Post from './post.aggregate';
import InvalidPostError from '../error/invalid-post.error';
import InvalidPostTagsError from '../error/invalid-post-tags.error';
import PostCreatedEvent from '../event/post-created.event';
import PostUpdatedEvent from '../event/post-updated.event';
import PostTagsUpdated from '../event/post-tags-updated.event';

describe('PostAggregate', () => {
  const makeProps = (overrides: Partial<Parameters<typeof Post.create>[0]> = {}) => ({
    id: new PostId(uuidv7()),
    clientId: new ClientId(uuidv7()),
    clientName: 'John Doe',
    title: 'My First Post',
    body: 'This is the body of my first post.',
    ...overrides,
  });

  it('should create a post aggregate', () => {
    const props = makeProps();

    const post = Post.create(props);

    expect(post).toBeInstanceOf(Post);
    expect(post.id).toEqual(props.id);
    expect(post.clientId).toEqual(props.clientId);
    expect(post.clientName).toEqual(props.clientName);
    expect(post.title).toEqual(props.title);
    expect(post.body).toEqual(props.body);
    expect(post.tags).toEqual([]);
    expect(post.createdAt).toBeInstanceOf(Date);
    expect(post.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw an error when creating a post aggregate with empty client name', () => {
    const props = makeProps({ clientName: '' });

    expect(() => Post.create(props)).toThrow(InvalidPostError);
    expect(() => Post.create(props)).toThrow(/Client name cannot be empty/);
  });

  it('should throw an error when creating a post aggregate with title exceeding 45 characters', () => {
    const props = makeProps({ title: 'a'.repeat(46) });

    expect(() => Post.create(props)).toThrow(InvalidPostError);
    expect(() => Post.create(props)).toThrow(/Title cannot exceed 45 characters/);
  });

  it('should throw an error when creating a post aggregate with body exceeding 2000 characters', () => {
    const props = makeProps({ body: 'a'.repeat(2001) });

    expect(() => Post.create(props)).toThrow(InvalidPostError);
    expect(() => Post.create(props)).toThrow(/Body cannot exceed 2000 characters/);
  });

  it('should update a post aggregate', () => {
    const post = Post.create(makeProps());

    post.update({ title: 'My Updated Post', body: 'Updated body.' });

    expect(post.title).toEqual('My Updated Post');
    expect(post.body).toEqual('Updated body.');
  });

  it('should update only the title and preserve the body when body is omitted', () => {
    const props = makeProps();
    const post = Post.create(props);

    post.update({ title: 'My Updated Post' });

    expect(post.title).toEqual('My Updated Post');
    expect(post.body).toEqual(props.body);
  });

  it('should update only the body and preserve the title when title is omitted', () => {
    const props = makeProps();
    const post = Post.create(props);

    post.update({ body: 'Updated body.' });

    expect(post.body).toEqual('Updated body.');
    expect(post.title).toEqual(props.title);
  });

  it('should throw an error when updating a post aggregate with empty title and body', () => {
    const post = Post.create(makeProps());

    expect(() => post.update({ title: '', body: '' })).toThrow(InvalidPostError);
    expect(() => post.update({ title: '', body: '' })).toThrow(/Title cannot be empty/);
    expect(() => post.update({ title: '', body: '' })).toThrow(/Body cannot be empty/);
  });

  it('should throw an error when updating a post aggregate with neither title nor body', () => {
    const post = Post.create(makeProps());

    expect(() => post.update({})).toThrow(InvalidPostError);
    expect(() => post.update({})).toThrow(/At least one of 'title' or 'body' must be provided/);
  });

  it('should refresh updatedAt when updating a post aggregate', () => {
    vi.useFakeTimers();
    try {
      const post = Post.create(makeProps());
      const previousUpdatedAt = post.updatedAt;

      vi.advanceTimersByTime(1000);

      post.update({ title: 'My Updated Post' });

      expect(post.updatedAt.getTime()).toBeGreaterThan(previousUpdatedAt.getTime());
    } finally {
      vi.useRealTimers();
    }
  });

  it('should reset tags when updating a post aggregate', () => {
    const post = Post.create(makeProps());
    post.applyTags(['tag1', 'tag2']);

    post.update({ title: 'My Updated Post' });

    expect(post.tags).toEqual([]);
  });

  it('should apply tags to a post aggregate', () => {
    const post = Post.create(makeProps());
    const tags = ['tag1', 'tag2', 'tag3'];

    post.applyTags(tags);

    expect(post.tags).toEqual(tags);
  });

  it('should throw an error when applying a tag exceeding 45 characters', () => {
    const post = Post.create(makeProps());

    expect(() => post.applyTags(['a'.repeat(46)])).toThrow(InvalidPostTagsError);
    expect(() => post.applyTags(['a'.repeat(46)])).toThrow(/Tag cannot exceed 45 characters/);
  });

  it('should throw an error when applying an empty tag', () => {
    const post = Post.create(makeProps());

    expect(() => post.applyTags([''])).toThrow(InvalidPostTagsError);
    expect(() => post.applyTags([''])).toThrow(/Tag cannot be empty/);
  });

  it('should throw an error when applying more than 10 tags', () => {
    const post = Post.create(makeProps());
    const tooManyTags = Array.from({ length: 11 }, (_, i) => `tag${i}`);

    expect(() => post.applyTags(tooManyTags)).toThrow(InvalidPostTagsError);
    expect(() => post.applyTags(tooManyTags)).toThrow(/Cannot have more than 10 tags/);
  });

  it('should throw an error when applying duplicate tags', () => {
    const post = Post.create(makeProps());
    const duplicateTags = ['tag', 'tag', 'tag'];

    expect(() => post.applyTags(duplicateTags)).toThrow(InvalidPostTagsError);
    expect(() => post.applyTags(duplicateTags)).toThrow(/Tags cannot be duplicated/);
  });

  it('should reset tags of a post aggregate', () => {
    const post = Post.create(makeProps());
    post.applyTags(['tag1', 'tag2', 'tag3']);

    post.resetTags();

    expect(post.tags).toEqual([]);
  });

  it('should reconstruct a post aggregate from existing properties', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const props = {
      id: new PostId(uuidv7()),
      clientId: new ClientId(uuidv7()),
      clientName: 'John Doe',
      title: 'My First Post',
      body: 'This is the body of my first post.',
      tags: ['tag1', 'tag2'],
      createdAt,
      updatedAt,
    };

    const post = Post.reconstruct(props);

    expect(post).toBeInstanceOf(Post);
    expect(post.id).toEqual(props.id);
    expect(post.clientId).toEqual(props.clientId);
    expect(post.clientName).toEqual(props.clientName);
    expect(post.title).toEqual(props.title);
    expect(post.body).toEqual(props.body);
    expect(post.tags).toEqual(props.tags);
    expect(post.createdAt).toEqual(createdAt);
    expect(post.updatedAt).toEqual(updatedAt);
  });

  it('should add a PostCreatedEvent when creating a post aggregate', () => {
    const props = makeProps();

    const post = Post.create(props);

    const events = post.getDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PostCreatedEvent);
    expect(events[0].eventName).toEqual('PostCreated');
    expect(events[0].payload).toEqual({
      postId: props.id.toString(),
      clientId: props.clientId.toString(),
      clientName: props.clientName,
      title: props.title,
      body: props.body,
      createdAt: post.createdAt.toISOString(),
    });
  });

  it('should not add any domain events when reconstructing a post aggregate', () => {
    const post = Post.reconstruct({
      id: new PostId(uuidv7()),
      clientId: new ClientId(uuidv7()),
      clientName: 'John Doe',
      title: 'My First Post',
      body: 'This is the body of my first post.',
      tags: ['tag1'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(post.getDomainEvents()).toEqual([]);
  });

  it('should add a PostUpdatedEvent when updating a post aggregate', () => {
    const props = makeProps();
    const post = Post.create(props);

    post.update({ title: 'My Updated Post', body: 'Updated body.' });

    const events = post.getDomainEvents();

    expect(events).toHaveLength(2);
    expect(events[1]).toBeInstanceOf(PostUpdatedEvent);
    expect(events[1].eventName).toEqual('PostUpdated');
    expect(events[1].payload).toEqual({
      postId: props.id.toString(),
      clientId: props.clientId.toString(),
      clientName: props.clientName,
      title: 'My Updated Post',
      body: 'Updated body.',
      updatedAt: post.updatedAt.toISOString(),
    });
  });

  it('should add a PostTagsUpdatedEvent when applying tags to a post aggregate', () => {
    const props = makeProps();
    const post = Post.create(props);
    const tags = ['tag1', 'tag2'];

    post.applyTags(tags);

    const events = post.getDomainEvents();

    expect(events).toHaveLength(2);
    expect(events[1]).toBeInstanceOf(PostTagsUpdated);
    expect(events[1].eventName).toEqual('PostTagsUpdated');
    expect(events[1].payload).toEqual({
      postId: props.id.toString(),
      clientId: props.clientId.toString(),
      tags,
    });
  });

  it('should not add a domain event when update fails validation', () => {
    const post = Post.create(makeProps());

    expect(() => post.update({ title: '' })).toThrow(InvalidPostError);
    expect(post.getDomainEvents()).toHaveLength(1);
  });

  it('should not add a domain event when applyTags fails validation', () => {
    const post = Post.create(makeProps());

    expect(() => post.applyTags([''])).toThrow(InvalidPostTagsError);
    expect(post.getDomainEvents()).toHaveLength(1);
  });

  it('should clear all domain events when calling clearDomainEvents', () => {
    const post = Post.create(makeProps());
    post.applyTags(['tag1']);

    expect(post.getDomainEvents()).toHaveLength(2);

    post.clearDomainEvents();

    expect(post.getDomainEvents()).toEqual([]);
  });
});
