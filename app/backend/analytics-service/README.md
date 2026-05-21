# analytics-service

Tracks post interactions and monitors engagement trends, emitting signals when post activity rises or falls significantly.

## Responsibilities

- Listens for post interaction events and records them as analytics log entries in PostgreSQL
- Ignores events for deleted posts to avoid polluting analytics data
- Runs an hourly scheduled job to evaluate engagement: raises or drops engagement signals based on view counts in a 24-hour window
- Persists engagement state per post (`raised` / `dropped`) to avoid duplicate signals
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

| Event                    | Description                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| `AnalyticsEventRecorded` | Emitted after each interaction is persisted                         |
| `PostEngagementRaised`   | Emitted when a post exceeds 10 views in the last 24 hours           |
| `PostEngagementDropped`  | Emitted when a raised post falls below 5 views in the last 24 hours |

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
