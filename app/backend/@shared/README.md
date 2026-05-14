# @drift/shared

Shared domain primitives, application interfaces, and infrastructure implementations used across all backend services.

## What's inside

### Domain

| Export | Description |
|---|---|
| `AggregateRoot` | Base class for aggregate roots — collects and clears domain events |
| `PostId` / `postIdSchema` | Value object for post identifiers (UUIDv7) |
| `ClientId` / `clientIdSchema` | Value object for client identifiers (UUIDv7) |
| `InvalidValueObjectError` | Error thrown when a value object receives an invalid input |
| `DomainEvent` | Interface all domain events must implement |

### Application interfaces

| Export | Description |
|---|---|
| `EventDispatcher` | Contract for publishing domain events to a message broker |
| `EventConsumer` | Contract for subscribing to domain events from a message broker |
| `EventHandler` | Contract for handling a specific domain event |
| `Logger` | Contract for structured logging |

### Infrastructure

| Export | Description |
|---|---|
| `RabbitMQEventDispatcher` | `EventDispatcher` implementation backed by RabbitMQ (via `amqp-connection-manager`) |
| `RabbitMQEventConsumer` | `EventConsumer` implementation backed by RabbitMQ |
| `PinoLogger` | `Logger` implementation backed by Pino |

## How services consume this package

This package is referenced as a local workspace dependency — no publishing required.

```json
// In a service's package.json
"dependencies": {
  "@drift/shared": "*"
}
```

```ts
import { AggregateRoot, RabbitMQEventDispatcher, PinoLogger } from '@drift/shared';
```

## Key libraries

- **Messaging:** `amqp-connection-manager`, `amqplib`
- **Logging:** `pino`
- **Validation:** `zod`
