import { uuidv7 } from 'uuidv7';

import { InvalidValueObjectError, PostId } from '../../index';

describe('PostId', () => {
  it('should create a PostId with a valid uuidv7', () => {
    const value = uuidv7();

    const postId = new PostId(value);

    expect(postId).toBeInstanceOf(PostId);
    expect(postId.toString()).toEqual(value);
  });

  it('should throw an error when value is not a valid uuid', () => {
    expect(() => new PostId('not-a-uuid')).toThrow(InvalidValueObjectError);
    expect(() => new PostId('not-a-uuid')).toThrow('Invalid PostId: not-a-uuid');
  });

  it('should throw an error when value is an empty string', () => {
    expect(() => new PostId('')).toThrow(InvalidValueObjectError);
    expect(() => new PostId('')).toThrow('Invalid PostId: ');
  });

  it('should throw an error when value is a uuidv4 instead of uuidv7', () => {
    const uuidv4Value = '550e8400-e29b-41d4-a716-446655440000';

    expect(() => new PostId(uuidv4Value)).toThrow(InvalidValueObjectError);
    expect(() => new PostId(uuidv4Value)).toThrow(`Invalid PostId: ${uuidv4Value}`);
  });

  it('should return true when comparing two PostIds with the same value', () => {
    const value = uuidv7();

    const a = new PostId(value);
    const b = new PostId(value);

    expect(a.equals(b)).toBe(true);
  });

  it('should return false when comparing two PostIds with different values', () => {
    const a = new PostId(uuidv7());
    const b = new PostId(uuidv7());

    expect(a.equals(b)).toBe(false);
  });
});
