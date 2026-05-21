import { InvalidValueObjectError } from '@drift/shared';
import { z } from 'zod';

export const analyticsLogIdSchema = z.uuidv7({ error: 'Invalid Analytics Log ID format' });

export default class AnalyticsLogId {
  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    const result = analyticsLogIdSchema.safeParse(this.value);
    if (!result.success) {
      throw new InvalidValueObjectError('AnalyticsLogId', this.value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: AnalyticsLogId): boolean {
    return this.value === other.value;
  }
}
