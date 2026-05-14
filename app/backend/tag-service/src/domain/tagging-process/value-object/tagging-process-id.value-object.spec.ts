import { uuidv7 } from 'uuidv7';
import { InvalidValueObjectError } from '@drift/shared';
import TaggingProcessId from './tagging-process-id.value-object';

describe('TaggingProcessId', () => {
  it('should create a TaggingProcessId with a valid uuidv7', () => {
    const value = uuidv7();

    const taggingProcessId = new TaggingProcessId(value);

    expect(taggingProcessId).toBeInstanceOf(TaggingProcessId);
    expect(taggingProcessId.toString()).toEqual(value);
  });

  it('should throw an error when value is not a valid uuid', () => {
    expect(() => new TaggingProcessId('not-a-uuid')).toThrow(InvalidValueObjectError);
    expect(() => new TaggingProcessId('not-a-uuid')).toThrow(
      'Invalid TaggingProcessId: not-a-uuid',
    );
  });

  it('should throw an error when value is an empty string', () => {
    expect(() => new TaggingProcessId('')).toThrow(InvalidValueObjectError);
    expect(() => new TaggingProcessId('')).toThrow('Invalid TaggingProcessId: ');
  });

  it('should throw an error when value is a uuidv4 instead of uuidv7', () => {
    const uuidv4Value = '550e8400-e29b-41d4-a716-446655440000';

    expect(() => new TaggingProcessId(uuidv4Value)).toThrow(InvalidValueObjectError);
    expect(() => new TaggingProcessId(uuidv4Value)).toThrow(
      `Invalid TaggingProcessId: ${uuidv4Value}`,
    );
  });

  it('should return true when comparing two TaggingProcessIds with the same value', () => {
    const value = uuidv7();

    const a = new TaggingProcessId(value);
    const b = new TaggingProcessId(value);

    expect(a.equals(b)).toBe(true);
  });

  it('should return false when comparing two TaggingProcessIds with different values', () => {
    const a = new TaggingProcessId(uuidv7());
    const b = new TaggingProcessId(uuidv7());

    expect(a.equals(b)).toBe(false);
  });
});
