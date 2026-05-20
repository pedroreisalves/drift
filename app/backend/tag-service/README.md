# tag-service

Automatically generates tags for posts using a local LLM, with retry logic for failed attempts.

## Responsibilities

- Listens for post creation and update events and initiates a tagging process
- Calls a local Ollama LLM to generate up to 10 tags per post
- Persists tagging process state (initialized, tagged, failed, abandoned) in PostgreSQL
- Retries failed tag generation up to 3 times before abandoning
- Publishes domain events so other services can react to tagging outcomes

## Events consumed

| Event                | Source service     |
| -------------------- | ------------------ |
| `PostCreated`        | post-service       |
| `PostUpdated`        | post-service       |
| `TaggingInitialized` | tag-service (self) |
| `TaggingFailed`      | tag-service (self) |

## Events produced

| Event                | Consumed by                             |
| -------------------- | --------------------------------------- |
| `TaggingInitialized` | tag-service (self — triggers execution) |
| `PostTagged`         | post-service                            |
| `TaggingFailed`      | tag-service (self — triggers retry)     |
| `TaggingAbandoned`   | post-service (clears tagging lock)      |

## Tech

- **Database:** PostgreSQL (tagging process state)
- **Messaging:** RabbitMQ topic exchange (`drift.events`)
- **LLM:** Ollama (local inference, default model `qwen2.5:1.5b`)
- **Key libraries:** `amqp-connection-manager`, `amqplib`, `pg`, `pino`, `zod`, `uuidv7`
- **Schema:** [`init.sql`](init.sql)

## Environment variables

| Variable            | Description                                | Example                                       |
| ------------------- | ------------------------------------------ | --------------------------------------------- |
| `DB_URL`            | PostgreSQL connection string               | `postgresql://user:pass@localhost:5432/drift` |
| `RABBITMQ_URL`      | RabbitMQ connection string                 | `amqp://user:pass@localhost:5672`             |
| `RABBITMQ_EXCHANGE` | RabbitMQ topic exchange name               | `drift.events`                                |
| `OLLAMA_URL`        | Ollama API base URL                        | `http://localhost:11434`                      |
| `OLLAMA_MODEL`      | Model to use for tag generation            | `qwen2.5:1.5b`                                |
| `OLLAMA_TIMEOUT_MS` | LLM request timeout in milliseconds        | `60000`                                       |
| `SERVICE_NAME`      | Identifies this service in logs and queues | `tag-service`                                 |
| `NODE_ENV`          | Runtime environment                        | `production`                                  |
| `LOG_LEVEL`         | Pino log level                             | `info`                                        |

## How to run

```bash
docker compose up tag-service
```
