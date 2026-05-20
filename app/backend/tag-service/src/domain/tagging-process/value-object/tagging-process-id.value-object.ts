import { z } from 'zod';
import { InvalidValueObjectError } from '@drift/shared';

export const taggingProcessIdSchema = z.uuidv7({ error: 'Invalid Post ID format' });

export default class TaggingProcessId {
  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    const result = taggingProcessIdSchema.safeParse(this.value);
    if (!result.success) {
      throw new InvalidValueObjectError('TaggingProcessId', this.value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: TaggingProcessId): boolean {
    return this.value === other.value;
  }
}
