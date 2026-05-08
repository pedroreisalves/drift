import { z } from 'zod';
import { InvalidValueObjectError } from '../../@shared/error/invalid-value-object.error';

const postIdSchema = z.uuidv7({ error: 'Invalid Post ID format' });

export default class PostId {
  constructor(private readonly value: string) {
    this.validate();
  }

  validate(): void {
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
