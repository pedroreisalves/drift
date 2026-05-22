import { z } from 'zod';
import { InvalidValueObjectError } from '@drift/shared';

export enum SignalEnum {
  raised = 'raised',
  dropped = 'dropped',
}

export const signalSchema = z.enum(
  SignalEnum,
  `Signal must be one of: ${Object.values(SignalEnum).join(', ')}`,
);

export default class Signal {
  constructor(private readonly value: SignalEnum) {
    this.validate();
  }

  private validate(): void {
    const result = signalSchema.safeParse(this.value);
    if (!result.success) {
      throw new InvalidValueObjectError('Signal', this.value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: Signal): boolean {
    return this.value === other.value;
  }
}
