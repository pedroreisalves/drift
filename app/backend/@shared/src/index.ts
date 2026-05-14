export { DomainEvent } from './domain/event/domain-event';
export { default as InvalidValueObjectError } from './domain/error/invalid-value-object.error';
export { default as PostId, postIdSchema } from './domain/value-object/post-id.value-object';
export { default as ClientId, clientIdSchema } from './domain/value-object/client-id.value-object';
export { AggregateRoot } from './domain/entity/aggregate-root';

export type { default as EventDispatcher } from './application/interface/event-dispatcher.interface';
export type { default as EventConsumer } from './application/interface/event-consumer.interface';
export type { default as EventHandler } from './application/interface/event-handler.interface';
export type { default as Logger } from './application/interface/logger.interface';

export { default as RabbitMQEventDispatcher } from './infrastructure/messaging/rabbitmq-event-dispatcher';
export { default as RabbitMQEventConsumer } from './infrastructure/messaging/rabbitmq-event-consumer';
export { default as PinoLogger } from './infrastructure/logging/pino-logger';
