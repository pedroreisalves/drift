# post-service

Manages post lifecycle (create, update, delete, read), featured post promotion, and engagement-driven demotion.

## Responsibilities

- Exposes HTTP endpoints for creating, updating, deleting, and reading posts
- Publishes domain events when posts change so other services can react
- Consumes `PostTagged` and applies tags to the Post aggregate; resets tags on update to trigger re-tagging
- Enforces a tagging lock: inserts a `post_locks` row on `TaggingInitialized` and rejects updates with HTTP 409 while locked; clears the lock on `PostTagged` or `TaggingAbandoned`
- Emits a `PostViewed` event as a middleware side effect on every `GET /posts/:id`
- Consumes `PostEngagementRaised` from analytics-service and promotes the post to featured; also clears any pending engagement-drop flag if the post had previously recovered
- Consumes `PostEngagementDropped` from analytics-service and flags the featured post as having a drop in engagement; silently ignored if the post is not currently featured
- Runs an hourly scheduled job (`CheckFeaturedExpiry`) that demotes all featured posts that are both engagement-drop flagged and have been featured for more than 48 hours
- When a featured post is deleted, removes featured state first and emits `FeaturedPostRemoved` before `PostDeleted`
- When a featured post is updated, automatically demotes it (reason: `post_updated`) before persisting — updated content starts fresh without inheriting the previous featured status

## HTTP endpoints

| Method   | Path         | Description                                                  |
| -------- | ------------ | ------------------------------------------------------------ |
| `POST`   | `/posts`     | Create a post                                                |
| `PUT`    | `/posts/:id` | Update a post (rejected with 409 while tagging lock is held) |
| `DELETE` | `/posts/:id` | Delete a post                                                |
| `GET`    | `/posts/:id` | Get a single post (emits `PostViewed` as side effect)        |
| `GET`    | `/posts`     | List posts                                                   |

## Events consumed

| Event                   | Source service                    |
| ----------------------- | --------------------------------- |
| `PostTagged`            | tag-service                       |
| `TaggingInitialized`    | tag-service (sets tagging lock)   |
| `TaggingAbandoned`      | tag-service (clears tagging lock) |
| `PostEngagementRaised`  | analytics-service                 |
| `PostEngagementDropped` | analytics-service                 |

## Events produced

| Event                     | Consumed by                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `PostCreated`             | tag-service, search-service, analytics-service                                                                                          |
| `PostUpdated`             | tag-service, search-service, analytics-service                                                                                          |
| `PostTagsUpdated`         | search-service                                                                                                                          |
| `PostDeleted`             | search-service, analytics-service                                                                                                       |
| `PostViewed`              | analytics-service                                                                                                                       |
| `PostPromoted`            | none                                                                                                                                    |
| `EngagementDropFlagged`   | none                                                                                                                                    |
| `EngagementDropRecovered` | none                                                                                                                                    |
| `PostDemoted`             | none (emitted by `CheckFeaturedExpiry` with reason `expiry_and_engagement_drop`, and by `UpdatePostUseCase` with reason `post_updated`) |
| `FeaturedPostRemoved`     | none                                                                                                                                    |

## Tech

- **Database:** PostgreSQL (`posts` table, `post_featured` table, `post_locks` table)
- **Messaging:** RabbitMQ topic exchange (`drift.events`)
- **Scheduler:** node-cron (`CheckFeaturedExpiry` runs every hour with `runAtStartup: true`)
- **HTTP:** Express 5
- **Key libraries:** `amqp-connection-manager`, `amqplib`, `pg`, `pino`, `zod`, `uuidv7`
- **Schema:** [`init.sql`](init.sql)

## Database schema

### `posts` table

| Column                    | Type          | Notes                                                           |
| ------------------------- | ------------- | --------------------------------------------------------------- |
| `id`                      | `UUID`        | Primary key                                                     |
| `client_id`               | `UUID`        |                                                                 |
| `client_name`             | `TEXT`        |                                                                 |
| `title`                   | `TEXT`        | Max 45 chars                                                    |
| `body`                    | `TEXT`        | Max 2000 chars                                                  |
| `tags`                    | `TEXT[]`      | Max 10 tags, reset on update                                    |
| `engagement_drop_flagged` | `BOOLEAN`     | Set by `PostEngagementDropped`, cleared on recovery or demotion |
| `created_at`              | `TIMESTAMPTZ` |                                                                 |
| `updated_at`              | `TIMESTAMPTZ` |                                                                 |

### `post_featured` table

Sparse table: a row is present only while a post is featured. Presence = featured; absence = not featured.

| Column        | Type          | Notes                                           |
| ------------- | ------------- | ----------------------------------------------- |
| `post_id`     | `UUID`        | Primary key; FK → `posts(id) ON DELETE CASCADE` |
| `featured_at` | `TIMESTAMPTZ` | Set to `NOW()` when the post is promoted        |

`isFeatured` and `featuredAt` on the Post aggregate are hydrated via `LEFT JOIN post_featured` on every read.

### `post_locks` table

Sparse table: a row is present only while a post is locked for a given operation. Presence = locked; absence = not locked.

| Column      | Type          | Notes                                                             |
| ----------- | ------------- | ----------------------------------------------------------------- |
| `post_id`   | `UUID`        | Composite PK with `lock_type`; FK → `posts(id) ON DELETE CASCADE` |
| `lock_type` | `TEXT`        | Currently only `'tagging'`; extensible to other lock types        |
| `locked_at` | `TIMESTAMPTZ` | Set to `NOW()` when the lock is acquired                          |

`isTaggingInProgress` on the Post aggregate is hydrated via `LEFT JOIN post_locks` on every read.

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
