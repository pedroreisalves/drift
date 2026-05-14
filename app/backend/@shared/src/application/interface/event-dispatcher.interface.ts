import type DomainEvent from '../../domain/interface/domain-event.interface';

export default interface EventDispatcher {
  dispatch: (event: DomainEvent) => Promise<void>;
}
