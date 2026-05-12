import { uuidv7 } from 'uuidv7';
import TaggingProcess from './tagging-process.aggregate';
import PostId from '../value-object/post-id.value-object';
import TaggingProcessId from '../value-object/tagging-process-id.value-object';
import TaggingStatus from '../value-object/tagging-status.value-object';
import InvalidTaggingProcessError from '../error/invalid-tagging-process.error';
import TaggingInitializedEvent from '../event/tagging-initialized.event';
import PostTaggedEvent from '../event/post-tagged.event';
import TaggingFailedEvent from '../event/tagging-failed.event';
import TaggingAbandonedEvent from '../event/tagging-abandoned.event';
import type { CreateTaggingProcessProps } from './tagging-process.aggregate';

describe('TaggingProcess', () => {
  const makeProps = (
    overrides: Partial<CreateTaggingProcessProps> = {},
  ): CreateTaggingProcessProps => ({
    id: new TaggingProcessId(uuidv7()),
    postId: new PostId(uuidv7()),
    title: 'My First Post',
    body: 'This is the body of my first post.',
    postUpdatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });

  it('should create a tagging process with initialized status and retryCount 0', () => {
    const props = makeProps();

    const tp = TaggingProcess.create(props);

    expect(tp).toBeInstanceOf(TaggingProcess);
    expect(tp.id).toEqual(props.id);
    expect(tp.postId).toEqual(props.postId);
    expect(tp.title).toEqual(props.title);
    expect(tp.body).toEqual(props.body);
    expect(tp.reason).toBeNull();
    expect(tp.retryCount).toBe(0);
    expect(tp.status.toString()).toBe('initialized');
    expect(tp.createdAt).toBeInstanceOf(Date);
    expect(tp.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw when id does not satisfy the uuidv7 format', () => {
    const props = makeProps({
      id: { toString: () => 'not-a-uuid' } as unknown as TaggingProcessId,
    });

    expect(() => TaggingProcess.create(props)).toThrow(InvalidTaggingProcessError);
    expect(() => TaggingProcess.create(props)).toThrow(/Invalid Tagging Process ID format/);
  });

  it('should throw when postId does not satisfy the uuidv7 format', () => {
    const props = makeProps({ postId: { toString: () => 'not-a-uuid' } as unknown as PostId });

    expect(() => TaggingProcess.create(props)).toThrow(InvalidTaggingProcessError);
    expect(() => TaggingProcess.create(props)).toThrow(/Invalid Post ID format/);
  });

  it('should throw when title is empty', () => {
    const props = makeProps({ title: '' });

    expect(() => TaggingProcess.create(props)).toThrow(InvalidTaggingProcessError);
    expect(() => TaggingProcess.create(props)).toThrow(/Title cannot be empty/);
  });

  it('should throw when title exceeds 45 characters', () => {
    const props = makeProps({ title: 'a'.repeat(46) });

    expect(() => TaggingProcess.create(props)).toThrow(InvalidTaggingProcessError);
    expect(() => TaggingProcess.create(props)).toThrow(/Title cannot exceed 45 characters/);
  });

  it('should throw when body is empty', () => {
    const props = makeProps({ body: '' });

    expect(() => TaggingProcess.create(props)).toThrow(InvalidTaggingProcessError);
    expect(() => TaggingProcess.create(props)).toThrow(/Body cannot be empty/);
  });

  it('should throw when body exceeds 2000 characters', () => {
    const props = makeProps({ body: 'a'.repeat(2001) });

    expect(() => TaggingProcess.create(props)).toThrow(InvalidTaggingProcessError);
    expect(() => TaggingProcess.create(props)).toThrow(/Body cannot exceed 2000 characters/);
  });

  it('should reconstruct a tagging process from existing properties', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const props = {
      id: new TaggingProcessId(uuidv7()),
      postId: new PostId(uuidv7()),
      title: 'My First Post',
      body: 'This is the body of my first post.',
      reason: 'AI service unavailable',
      retryCount: 2,
      status: new TaggingStatus('failed'),
      tags: [],
      postUpdatedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt,
      updatedAt,
    };

    const tp = TaggingProcess.reconstruct(props);

    expect(tp).toBeInstanceOf(TaggingProcess);
    expect(tp.id).toEqual(props.id);
    expect(tp.postId).toEqual(props.postId);
    expect(tp.title).toEqual(props.title);
    expect(tp.body).toEqual(props.body);
    expect(tp.reason).toEqual(props.reason);
    expect(tp.retryCount).toBe(2);
    expect(tp.status.toString()).toBe('failed');
    expect(tp.postUpdatedAt).toEqual(props.postUpdatedAt);
    expect(tp.createdAt).toEqual(createdAt);
    expect(tp.updatedAt).toEqual(updatedAt);
  });

  it('should not add any domain events when reconstructing', () => {
    const tp = TaggingProcess.reconstruct({
      id: new TaggingProcessId(uuidv7()),
      postId: new PostId(uuidv7()),
      title: 'My First Post',
      body: 'This is the body of my first post.',
      reason: null,
      retryCount: 0,
      status: new TaggingStatus('initialized'),
      tags: [],
      postUpdatedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(tp.getDomainEvents()).toEqual([]);
  });

  it('should set status to tagged and refresh updatedAt on succeed', () => {
    vi.useFakeTimers();
    try {
      const tp = TaggingProcess.create(makeProps());
      const previousUpdatedAt = tp.updatedAt;

      vi.advanceTimersByTime(1000);
      tp.succeed({ tags: ['tech', 'news'] });

      expect(tp.status.toString()).toBe('tagged');
      expect(tp.updatedAt.getTime()).toBeGreaterThan(previousUpdatedAt.getTime());
    } finally {
      vi.useRealTimers();
    }
  });

  it('should reset reason to null on succeed', () => {
    const tp = TaggingProcess.create(makeProps());
    tp.fail({ reason: 'AI service unavailable' });

    tp.succeed({ tags: ['tech'] });

    expect(tp.reason).toBeNull();
  });

  it('should store tags on succeed', () => {
    const tp = TaggingProcess.create(makeProps());
    const tags = ['tech', 'news'];

    tp.succeed({ tags });

    expect(tp.tags).toEqual(tags);
  });

  it('should initialise with an empty tags list', () => {
    const tp = TaggingProcess.create(makeProps());

    expect(tp.tags).toEqual([]);
  });

  it('should throw when a tag exceeds 45 characters', () => {
    const tp = TaggingProcess.create(makeProps());

    expect(() => tp.succeed({ tags: ['a'.repeat(46)] })).toThrow(InvalidTaggingProcessError);
    expect(() => tp.succeed({ tags: ['a'.repeat(46)] })).toThrow(/Tag cannot exceed 45 characters/);
  });

  it('should throw when a tag is empty', () => {
    const tp = TaggingProcess.create(makeProps());

    expect(() => tp.succeed({ tags: [''] })).toThrow(InvalidTaggingProcessError);
    expect(() => tp.succeed({ tags: [''] })).toThrow(/Tag cannot be empty/);
  });

  it('should throw when more than 10 tags are provided', () => {
    const tp = TaggingProcess.create(makeProps());
    const tooManyTags = Array.from({ length: 11 }, (_, i) => `tag${i}`);

    expect(() => tp.succeed({ tags: tooManyTags })).toThrow(InvalidTaggingProcessError);
    expect(() => tp.succeed({ tags: tooManyTags })).toThrow(/Cannot have more than 10 tags/);
  });

  it('should throw when tags contain duplicates', () => {
    const tp = TaggingProcess.create(makeProps());

    expect(() => tp.succeed({ tags: ['tag', 'tag'] })).toThrow(InvalidTaggingProcessError);
    expect(() => tp.succeed({ tags: ['tag', 'tag'] })).toThrow(/Tags cannot be duplicated/);
  });

  it('should set status to failed, store reason, and increment retryCount when retries are left', () => {
    const tp = TaggingProcess.create(makeProps());

    tp.fail({ reason: 'AI service unavailable' });

    expect(tp.status.toString()).toBe('failed');
    expect(tp.reason).toBe('AI service unavailable');
    expect(tp.retryCount).toBe(1);
  });

  it('should refresh updatedAt on fail', () => {
    vi.useFakeTimers();
    try {
      const tp = TaggingProcess.create(makeProps());
      const previousUpdatedAt = tp.updatedAt;

      vi.advanceTimersByTime(1000);
      tp.fail({ reason: 'AI service unavailable' });

      expect(tp.updatedAt.getTime()).toBeGreaterThan(previousUpdatedAt.getTime());
    } finally {
      vi.useRealTimers();
    }
  });

  it('should set status to abandoned and store reason when retryCount has reached 3', () => {
    const tp = TaggingProcess.reconstruct({
      id: new TaggingProcessId(uuidv7()),
      postId: new PostId(uuidv7()),
      title: 'My First Post',
      body: 'This is the body of my first post.',
      reason: null,
      retryCount: 3,
      status: new TaggingStatus('failed'),
      tags: [],
      postUpdatedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    tp.fail({ reason: 'AI service unavailable' });

    expect(tp.status.toString()).toBe('abandoned');
    expect(tp.reason).toBe('AI service unavailable');
  });

  it('should add a TaggingInitializedEvent when creating', () => {
    const props = makeProps();

    const tp = TaggingProcess.create(props);

    const events = tp.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(TaggingInitializedEvent);
    expect(events[0].eventName).toBe('TaggingInitialized');
    expect(events[0].payload).toEqual({
      taggingProcessId: props.id.toString(),
      postId: props.postId.toString(),
      retryCount: 0,
      initializedAt: tp.createdAt.toISOString(),
    });
  });

  it('should add a PostTaggedEvent when succeed is called', () => {
    const props = makeProps();
    const tp = TaggingProcess.create(props);
    const tags = ['tech', 'news'];

    tp.succeed({ tags });

    const events = tp.getDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toBeInstanceOf(PostTaggedEvent);
    expect(events[1].eventName).toBe('PostTagged');
    expect(events[1].payload).toEqual({
      taggingProcessId: props.id.toString(),
      postId: props.postId.toString(),
      tags,
      taggedAt: tp.updatedAt.toISOString(),
      postUpdatedAt: props.postUpdatedAt.toISOString(),
    });
  });

  it('should not add a domain event when succeed fails validation', () => {
    const tp = TaggingProcess.create(makeProps());

    expect(() => tp.succeed({ tags: [''] })).toThrow(InvalidTaggingProcessError);
    expect(tp.getDomainEvents()).toHaveLength(1);
  });

  it('should not add a domain event when fail fails validation', () => {
    const tp = TaggingProcess.create(makeProps());

    expect(() => tp.fail({ reason: '' })).toThrow(InvalidTaggingProcessError);
    expect(() => tp.fail({ reason: '' })).toThrow(/Reason cannot be empty/);
    expect(tp.getDomainEvents()).toHaveLength(1);
  });

  it('should add a TaggingFailedEvent when fail is called with retries left', () => {
    const props = makeProps();
    const tp = TaggingProcess.create(props);

    tp.fail({ reason: 'AI service unavailable' });

    const events = tp.getDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toBeInstanceOf(TaggingFailedEvent);
    expect(events[1].eventName).toBe('TaggingFailed');
    expect(events[1].payload).toEqual({
      taggingProcessId: props.id.toString(),
      postId: props.postId.toString(),
      reason: 'AI service unavailable',
      retryCount: 1,
      failedAt: tp.updatedAt.toISOString(),
    });
  });

  it('should add a TaggingAbandonedEvent when fail is called with no retries left', () => {
    const props = makeProps();
    const tp = TaggingProcess.reconstruct({
      id: props.id,
      postId: props.postId,
      title: props.title,
      body: props.body,
      reason: null,
      retryCount: 3,
      status: new TaggingStatus('failed'),
      tags: [],
      postUpdatedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    tp.fail({ reason: 'AI service unavailable' });

    const events = tp.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(TaggingAbandonedEvent);
    expect(events[0].eventName).toBe('TaggingAbandoned');
    expect(events[0].payload).toEqual({
      taggingProcessId: props.id.toString(),
      postId: props.postId.toString(),
      reason: 'AI service unavailable',
      retryCount: 3,
      abandonedAt: tp.updatedAt.toISOString(),
    });
  });

  it('should clear all domain events', () => {
    const tp = TaggingProcess.create(makeProps());
    tp.fail({ reason: 'AI service unavailable' });

    expect(tp.getDomainEvents()).toHaveLength(2);

    tp.clearDomainEvents();

    expect(tp.getDomainEvents()).toEqual([]);
  });
});
