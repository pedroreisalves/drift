import { z } from 'zod';
import { InvalidValueObjectError } from '@drift/shared';

export enum EventTypeEnum {
  PostCreated = 'PostCreated',
  PostViewed = 'PostViewed',
  PostUpdated = 'PostUpdated',
  PostSearched = 'PostSearched',
  PostDeleted = 'PostDeleted',
}

export const eventTypeSchema = z.enum(
  EventTypeEnum,
  `Event type must be one of: ${Object.values(EventTypeEnum).join(', ')}`,
);

export default class EventType {
  constructor(private readonly value: EventTypeEnum) {
    this.validate();
  }

  private validate(): void {
    const result = eventTypeSchema.safeParse(this.value);
    if (!result.success) {
      throw new InvalidValueObjectError('EventType', this.value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: EventType): boolean {
    return this.value === other.value;
  }
}
