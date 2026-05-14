import { z } from 'zod';
import { InvalidValueObjectError } from '@drift/shared';

export const statusSchema = z.enum(['initialized', 'tagged', 'failed', 'abandoned'], {
  message: 'Status must be one of: initialized, tagged, failed, abandoned',
});

export type TaggingStatusEnum = z.infer<typeof statusSchema>;

export default class TaggingStatus {
  constructor(private readonly value: TaggingStatusEnum) {
    this.validate();
  }

  validate(): void {
    const result = statusSchema.safeParse(this.value);
    if (!result.success) {
      throw new InvalidValueObjectError('Status', this.value);
    }
  }

  toString(): TaggingStatusEnum {
    return this.value;
  }

  equals(other: TaggingStatus): boolean {
    return this.value === other.value;
  }
}
