export abstract class DomainEvent<T extends Record<string, unknown> = Record<string, unknown>> {
  abstract readonly eventName: string;
  abstract readonly payload: T;
  readonly occurredAt: Date;

  constructor() {
    this.occurredAt = new Date();
  }
}
