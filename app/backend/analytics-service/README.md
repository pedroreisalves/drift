# analytics-service

Tracks post interactions and monitors engagement trends, emitting signals when post activity rises or falls significantly.

## Responsibilities

- Listens for all post interaction events (`PostCreated`, `PostUpdated`, `PostViewed`, `PostSearched`, `PostDeleted`) and appends them as log entries in PostgreSQL
- Registers deleted posts in a `deleted_posts` table so they can be excluded from engagement evaluation
- Runs an hourly scheduled job that evaluates two candidate sets:
  - **Raise candidates** — posts with views in the last 24h that are not already in `raised` state; emits `PostEngagementRaised` if views > 10
  - **Drop candidates** — posts currently in `raised` state; emits `PostEngagementDropped` if views < 5 in the last 24h and the post has been raised for ≥ 48h
- Persists the last engagement signal per post so raise/drop events are only emitted on state transition
- Publishes domain events when a post's engagement level changes

## Events consumed

| Event          | Source service |
| -------------- | -------------- |
| `PostCreated`  | post-service   |
| `PostUpdated`  | post-service   |
| `PostViewed`   | post-service   |
| `PostSearched` | search-service |
| `PostDeleted`  | post-service   |

## Events produced

| Event                    | Consumed by      |
| ------------------------ | ---------------- |
| `AnalyticsEventRecorded` | none             |
| `PostEngagementRaised`   | featured-service |
| `PostEngagementDropped`  | featured-service |

## Tech

- **Database:** PostgreSQL (`analytics_log`, `engagement_state`, `deleted_posts` tables)
- **Messaging:** RabbitMQ topic exchange (`drift.events`)
- **Scheduler:** node-cron (engagement check runs every hour)
- **Key libraries:** `amqp-connection-manager`, `amqplib`, `pg`, `pino`, `zod`, `uuidv7`
- **Schema:** [`init.sql`](init.sql)

## Environment variables

| Variable            | Description                                | Example                                       |
| ------------------- | ------------------------------------------ | --------------------------------------------- |
| `DB_URL`            | PostgreSQL connection string               | `postgresql://user:pass@localhost:5432/drift` |
| `RABBITMQ_URL`      | RabbitMQ connection string                 | `amqp://user:pass@localhost:5672`             |
| `RABBITMQ_EXCHANGE` | RabbitMQ topic exchange name               | `drift.events`                                |
| `SERVICE_NAME`      | Identifies this service in logs and queues | `analytics-service`                           |
| `NODE_ENV`          | Runtime environment                        | `production`                                  |
| `LOG_LEVEL`         | Pino log level                             | `info`                                        |

## How to run

```bash
docker compose up analytics-service
```
