# post-service

Manages post lifecycle (create, update, delete, read) and exposes a REST API for clients.

## Responsibilities

- Exposes HTTP endpoints for creating, updating, deleting, and reading posts
- Publishes domain events when posts change so other services can react
- Consumes `PostTagged` and applies tags to the Post aggregate; resets tags on update to trigger re-tagging
- Enforces a tagging lock: inserts a `post_locks` row on `TaggingInitialized` and rejects updates with HTTP 409 while locked; clears the lock on `PostTagged` or `TaggingAbandoned`
- Emits a `PostViewed` event as a middleware side effect on every `GET /posts/:id`

## HTTP endpoints

| Method   | Path         | Description                                                  |
| -------- | ------------ | ------------------------------------------------------------ |
| `POST`   | `/posts`     | Create a post                                                |
| `PUT`    | `/posts/:id` | Update a post (rejected with 409 while tagging lock is held) |
| `DELETE` | `/posts/:id` | Delete a post                                                |
| `GET`    | `/posts/:id` | Get a single post (emits `PostViewed` as side effect)        |
| `GET`    | `/posts`     | List posts                                                   |

## Events consumed

| Event                | Source service                    |
| -------------------- | --------------------------------- |
| `PostTagged`         | tag-service                       |
| `TaggingInitialized` | tag-service (sets tagging lock)   |
| `TaggingAbandoned`   | tag-service (clears tagging lock) |

## Events produced

| Event             | Consumed by                                         |
| ----------------- | --------------------------------------------------- |
| `PostCreated`     | tag-service, search-service, analytics-service      |
| `PostUpdated`     | tag-service, search-service, analytics-service      |
| `PostTagsUpdated` | search-service                                      |
| `PostDeleted`     | search-service, analytics-service, featured-service |
| `PostViewed`      | analytics-service                                   |

## Tech

- **Database:** PostgreSQL (`posts` table, `post_locks` table)
- **Messaging:** RabbitMQ topic exchange (`drift.events`)
- **HTTP:** Express 5
- **Key libraries:** `amqp-connection-manager`, `amqplib`, `pg`, `pino`, `zod`, `uuidv7`
- **Schema:** [`init.sql`](init.sql)

## Environment variables

| Variable            | Description                                | Example                                       |
| ------------------- | ------------------------------------------ | --------------------------------------------- |
| `DB_URL`            | PostgreSQL connection string               | `postgresql://user:pass@localhost:5432/drift` |
| `RABBITMQ_URL`      | RabbitMQ connection string                 | `amqp://user:pass@localhost:5672`             |
| `RABBITMQ_EXCHANGE` | RabbitMQ topic exchange name               | `drift.events`                                |
| `PORT`              | HTTP port to listen on                     | `3001`                                        |
| `SERVICE_NAME`      | Identifies this service in logs and queues | `post-service`                                |
| `NODE_ENV`          | Runtime environment                        | `production`                                  |
| `LOG_LEVEL`         | Pino log level                             | `info`                                        |

## How to run

```bash
docker compose up post-service
```
