import { DomainEvent } from '../event/domain-event';
import { AggregateRoot } from './aggregate-root';

class StubEvent extends DomainEvent {
  readonly eventName = 'StubEvent';
  readonly payload: Record<string, unknown>;

  constructor(payload: Record<string, unknown> = {}) {
    super();
    this.payload = payload;
  }
}

class StubAggregate extends AggregateRoot {
  dispatch(event: DomainEvent): void {
    this.addDomainEvent(event);
  }
}

describe('AggregateRoot', () => {
  it('should start with no domain events', () => {
    const aggregate = new StubAggregate();

    expect(aggregate.getDomainEvents()).toEqual([]);
  });

  it('should add a domain event', () => {
    const aggregate = new StubAggregate();
    const event = new StubEvent({ foo: 'bar' });

    aggregate.dispatch(event);

    expect(aggregate.getDomainEvents()).toHaveLength(1);
    expect(aggregate.getDomainEvents()[0]).toBe(event);
  });

  it('should accumulate multiple domain events in order', () => {
    const aggregate = new StubAggregate();
    const first = new StubEvent({ order: 1 });
    const second = new StubEvent({ order: 2 });

    aggregate.dispatch(first);
    aggregate.dispatch(second);

    const events = aggregate.getDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[0]).toBe(first);
    expect(events[1]).toBe(second);
  });

  it('should return a copy of domain events, not the internal array', () => {
    const aggregate = new StubAggregate();
    aggregate.dispatch(new StubEvent());

    const events = aggregate.getDomainEvents();
    events.push(new StubEvent());

    expect(aggregate.getDomainEvents()).toHaveLength(1);
  });

  it('should clear all domain events', () => {
    const aggregate = new StubAggregate();
    aggregate.dispatch(new StubEvent());
    aggregate.dispatch(new StubEvent());

    aggregate.clearDomainEvents();

    expect(aggregate.getDomainEvents()).toEqual([]);
  });

  it('should allow adding events again after clearing', () => {
    const aggregate = new StubAggregate();
    aggregate.dispatch(new StubEvent());
    aggregate.clearDomainEvents();

    const event = new StubEvent({ after: 'clear' });
    aggregate.dispatch(event);

    expect(aggregate.getDomainEvents()).toHaveLength(1);
    expect(aggregate.getDomainEvents()[0]).toBe(event);
  });
});
