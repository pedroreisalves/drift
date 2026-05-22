import type { DomainEvent } from '../../domain/event/domain-event';

export default interface EventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
}
