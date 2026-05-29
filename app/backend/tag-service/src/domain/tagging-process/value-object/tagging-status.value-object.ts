import { InvalidValueObjectError } from '@drift/shared';
import { z } from 'zod';

export enum TaggingStatusEnum {
  initialized = 'initialized',
  tagged = 'tagged',
  failed = 'failed',
  abandoned = 'abandoned',
}

export const statusSchema = z.enum(
  TaggingStatusEnum,
  `Status must be one of: ${Object.values(TaggingStatusEnum).join(', ')}`,
);

export default class TaggingStatus {
  constructor(private readonly value: TaggingStatusEnum) {
    this.validate();
  }

  private validate(): void {
    const result = statusSchema.safeParse(this.value);
    if (!result.success) {
      throw new InvalidValueObjectError('TaggingStatus', this.value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: TaggingStatus): boolean {
    return this.value === other.value;
  }
}
