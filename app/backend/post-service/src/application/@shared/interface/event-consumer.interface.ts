import EventHandler from './event-handler.interface';

export default interface EventConsumer {
  subscribe(eventName: string, handler: EventHandler): Promise<void>;
}
