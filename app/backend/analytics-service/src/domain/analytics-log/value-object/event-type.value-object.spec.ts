import { InvalidValueObjectError } from '@drift/shared';
import EventType, { EventTypeEnum } from './event-type.value-object';

describe('EventType', () => {
  it.each(Object.values(EventTypeEnum))(
    'should create an event type value object with valid value "%s"',
    (value) => {
      const eventType = new EventType(value);

      expect(eventType).toBeInstanceOf(EventType);
      expect(eventType.toString()).toEqual(value);
    },
  );

  it('should throw an error when creating an event type with invalid type', () => {
    const invalidEventType = 'InvalidEvent' as unknown as EventTypeEnum;

    expect(() => new EventType(invalidEventType)).toThrow(InvalidValueObjectError);
    expect(() => new EventType(invalidEventType)).toThrow(/Invalid EventType/);
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
