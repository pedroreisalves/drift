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
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set occurredAt to current date on construction', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    vi.setSystemTime(now);

    const event = new StubEvent({ id: '1' });

    expect(event.occurredAt).toEqual(now);
  });

  it('should expose the eventName defined by the subclass', () => {
    const event = new StubEvent({ id: '1' });

    expect(event.eventName).toBe('StubEvent');
  });

  it('should expose the payload passed to the constructor', () => {
    const event = new StubEvent({ id: 'abc' });

    expect(event.payload).toEqual({ id: 'abc' });
  });

  it('should have different occurredAt for events created at different times', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const first = new StubEvent({ id: '1' });

    vi.setSystemTime(new Date('2026-01-01T00:00:00.001Z'));
    const second = new StubEvent({ id: '2' });

    expect(second.occurredAt.getTime()).toBeGreaterThan(first.occurredAt.getTime());
  });
});
