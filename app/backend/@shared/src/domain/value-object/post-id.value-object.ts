import { z } from 'zod';

import InvalidValueObjectError from '../error/invalid-value-object.error';

export const postIdSchema = z.uuidv7({ error: 'Invalid Post ID format' });

export default class PostId {
  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    const result = postIdSchema.safeParse(this.value);
    if (!result.success) {
      throw new InvalidValueObjectError('PostId', this.value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: PostId): boolean {
    return this.value === other.value;
  }
}
