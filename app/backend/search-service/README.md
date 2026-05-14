# search-service

Indexes posts into Meilisearch and exposes a full-text search API for clients.

## Responsibilities

- Listens for post lifecycle events and keeps a Meilisearch index up to date
- Indexes post title, body, and tags so they are searchable
- Exposes an HTTP endpoint for full-text post search with pagination
- Publishes domain events for every indexing and search operation so other services can react

## HTTP endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/search` | Search indexed posts (`q`, `clientId`, `limit`, `offset` query params) |

## Events consumed

| Event | Source service |
|---|---|
| `PostCreated` | post-service |
| `PostUpdated` | post-service |
| `PostDeleted` | post-service |
| `PostTagsUpdated` | post-service |

## Events produced

| Event | Consumed by |
|---|---|
| `PostIndexed` | analytics-service |
| `PostTagsIndexed` | analytics-service |
| `PostRemovedFromIndex` | analytics-service |
| `PostSearched` | analytics-service |

## Tech

- **Search:** Meilisearch (`posts` index)
- **Messaging:** RabbitMQ topic exchange (`drift.events`)
- **HTTP:** Express
- **Key libraries:** `amqp-connection-manager`, `amqplib`, `pino`, `zod`

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `MEILISEARCH_URL` | Meilisearch base URL | `http://localhost:7700` |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://user:pass@localhost:5672` |
| `RABBITMQ_EXCHANGE` | RabbitMQ topic exchange name | `drift.events` |
| `PORT` | HTTP port to listen on | `3002` |
| `SERVICE_NAME` | Identifies this service in logs and queues | `search-service` |
| `NODE_ENV` | Runtime environment | `production` |
| `LOG_LEVEL` | Pino log level | `info` |

## How to run

```bash
docker compose up search-service
```
