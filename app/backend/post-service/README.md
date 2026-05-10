# post-service

Manages post lifecycle (create, update, delete, read) and exposes a REST API for clients.

## Responsibilities

- Exposes HTTP endpoints for creating, updating, deleting, and reading posts
- Publishes domain events when posts change so other services can react
- Consumes `PostTagged` events from tag-service and applies tags to the post
- Resets tags whenever a post is updated, triggering re-tagging automatically
- Emits a `PostViewed` event on every GET request to a single post

## Events consumed

| Event | Source service |
|---|---|
| `PostTagged` | tag-service |

## Events produced

| Event | Consumed by |
|---|---|
| `PostCreated` | tag-service |
| `PostUpdated` | tag-service |
| `PostTagsUpdated` | search-service |
| `PostDeleted` | search-service, analytics-service |
| `PostViewed` | analytics-service |

## Tech

- **Database:** PostgreSQL (`posts` table)
- **Messaging:** RabbitMQ topic exchange (`drift.events`)
- **HTTP:** Express 5
- **Key libraries:** `amqp-connection-manager`, `pg`, `pino`, `zod`, `uuidv7`

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `DB_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/drift` |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://user:pass@localhost:5672` |
| `RABBITMQ_EXCHANGE` | RabbitMQ topic exchange name | `drift.events` |
| `PORT` | HTTP port to listen on | `3001` |
| `SERVICE_NAME` | Identifies this service in logs and queues | `post-service` |
| `NODE_ENV` | Runtime environment | `production` |
| `LOG_LEVEL` | Pino log level | `info` |

## How to run

```bash
docker compose up post-service
```
