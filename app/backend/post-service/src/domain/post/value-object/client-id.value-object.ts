import { z } from 'zod';
import { InvalidValueObjectError } from '../../@shared/error/invalid-value-object.error';

const clientIdSchema = z.uuidv7({ error: 'Invalid Client ID format' });

export default class ClientId {
  constructor(private readonly value: string) {
    this.validate();
  }

  validate(): void {
    const result = clientIdSchema.safeParse(this.value);
    if (!result.success) {
      throw new InvalidValueObjectError('ClientId', this.value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: ClientId): boolean {
    return this.value === other.value;
  }
}
