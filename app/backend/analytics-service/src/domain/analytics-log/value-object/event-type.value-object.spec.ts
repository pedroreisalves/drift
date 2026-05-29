import { InvalidValueObjectError } from '@drift/shared';

import EventType, { EventTypeEnum } from './event-type.value-object';

describe('EventType', () => {
  it.each(Object.values(EventTypeEnum))(
    'should create an EventType with valid value "%s"',
    (value) => {
      const eventType = new EventType(value);

      expect(eventType).toBeInstanceOf(EventType);
      expect(eventType.toString()).toBe(value);
    },
  );

  it('should throw when value is not one of the allowed event types', () => {
    expect(() => new EventType('InvalidEvent' as never)).toThrow(InvalidValueObjectError);
    expect(() => new EventType('InvalidEvent' as never)).toThrow('Invalid EventType: InvalidEvent');
  });

  it('should throw when value is an empty string', () => {
    expect(() => new EventType('' as never)).toThrow(InvalidValueObjectError);
    expect(() => new EventType('' as never)).toThrow('Invalid EventType: ');
  });

  it('should return true when comparing equal event types', () => {
    const eventType1 = new EventType(EventTypeEnum.PostCreated);
    const eventType2 = new EventType(EventTypeEnum.PostCreated);

    expect(eventType1.equals(eventType2)).toBe(true);
  });

  it('should return false when comparing different event types', () => {
    const eventType1 = new EventType(EventTypeEnum.PostCreated);
    const eventType2 = new EventType(EventTypeEnum.PostViewed);

    expect(eventType1.equals(eventType2)).toBe(false);
  });
});
