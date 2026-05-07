import DomainEvent from '../../../domain/@shared/interface/domain-event.interface';

export default interface EventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
}
