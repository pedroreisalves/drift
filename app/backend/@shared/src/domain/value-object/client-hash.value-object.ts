import { z } from 'zod';

import InvalidValueObjectError from '../error/invalid-value-object.error';

export const clientHashSchema = z.string().regex(/^[0-9a-f]{64}$/, 'Invalid ClientHash format');

export default class ClientHash {
  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    const result = clientHashSchema.safeParse(this.value);
    if (!result.success) {
      throw new InvalidValueObjectError('ClientHash', this.value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: ClientHash): boolean {
    return this.value === other.value;
  }
}
