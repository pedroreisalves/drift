import { DomainEvent } from './domain-event';

interface StubPayload extends Record<string, unknown> {
  id: string;
}

class StubEvent extends DomainEvent<StubPayload> {
  readonly eventName = 'StubEvent';
  readonly payload: StubPayload;

  constructor(payload: StubPayload) {
    super();
    this.payload = payload;
  }
}

describe('DomainEvent', () => {
  it('should set occurredAt to current date on construction', () => {
    const before = new Date();
    const event = new StubEvent({ id: '1' });
    const after = new Date();

    expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should expose the eventName defined by the subclass', () => {
    const event = new StubEvent({ id: '1' });

    expect(event.eventName).toBe('StubEvent');
  });

  it('should expose the payload passed to the constructor', () => {
    const event = new StubEvent({ id: 'abc' });

    expect(event.payload).toEqual({ id: 'abc' });
  });

  it('should have different occurredAt for events created at different times', async () => {
    const first = new StubEvent({ id: '1' });
    await new Promise((resolve) => setTimeout(resolve, 1));
    const second = new StubEvent({ id: '2' });

    expect(second.occurredAt.getTime()).toBeGreaterThan(first.occurredAt.getTime());
  });
});
