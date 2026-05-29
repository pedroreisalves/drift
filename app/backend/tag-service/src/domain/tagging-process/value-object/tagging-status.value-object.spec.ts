import { InvalidValueObjectError } from '@drift/shared';

import TaggingStatus, { TaggingStatusEnum } from './tagging-status.value-object';

describe('TaggingStatus', () => {
  it.each(Object.values(TaggingStatusEnum))(
    'should create a TaggingStatus with the valid value "%s"',
    (value) => {
      const status = new TaggingStatus(value);

      expect(status).toBeInstanceOf(TaggingStatus);
      expect(status.toString()).toBe(value);
    },
  );

  it('should throw an error when value is not one of the allowed statuses', () => {
    expect(() => new TaggingStatus('pending' as never)).toThrow(InvalidValueObjectError);
    expect(() => new TaggingStatus('pending' as never)).toThrow('Invalid TaggingStatus: pending');
  });

  it('should throw an error when value is an empty string', () => {
    expect(() => new TaggingStatus('' as never)).toThrow(InvalidValueObjectError);
    expect(() => new TaggingStatus('' as never)).toThrow('Invalid TaggingStatus: ');
  });

  it('should return true when comparing two TaggingStatuses with the same value', () => {
    const a = new TaggingStatus(TaggingStatusEnum.initialized);
    const b = new TaggingStatus(TaggingStatusEnum.initialized);

    expect(a.equals(b)).toBe(true);
  });

  it('should return false when comparing two TaggingStatuses with different values', () => {
    const a = new TaggingStatus(TaggingStatusEnum.initialized);
    const b = new TaggingStatus(TaggingStatusEnum.tagged);

    expect(a.equals(b)).toBe(false);
  });
});
