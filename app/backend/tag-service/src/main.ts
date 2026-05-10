import { Pool } from 'pg';
import Environment from './infrastructure/config/environment';

import RabbitMQEventDispatcher from './infrastructure/messaging/rabbitmq-event-dispatcher';
import RabbitMQEventConsumer from './infrastructure/messaging/rabbitmq-event-consumer';
import PostgresTaggingProcessRepository from './infrastructure/persistence/postgres-tagging-process.repository';
import OllamaTagGenerator from './infrastructure/llm/ollama-tag-generator';
import PinoLogger from './infrastructure/logging/pino-logger';
import ExecuteTaggingHandler from './application/command/execute-tagging/execute-tagging.handler';
import TagPostHandler from './application/command/tag-post/tag-post.handler';
import PostChangedEventHandler from './application/event-handler/post-changed.event-handler';
import TaggingInitializedEventHandler from './application/event-handler/tagging-initialized.event-handler';
import TaggingFailedEventHandler from './application/event-handler/tagging-failed.event-handler';

const logger = new PinoLogger(Environment.SERVICE_NAME);

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: Environment.DB_URL });
  const repository = new PostgresTaggingProcessRepository(pool);
  const tagGenerator = new OllamaTagGenerator(
    Environment.OLLAMA_URL,
    Environment.OLLAMA_MODEL,
    Environment.OLLAMA_TIMEOUT_MS,
  );
  const dispatcher = new RabbitMQEventDispatcher(
    Environment.RABBITMQ_URL,
    Environment.RABBITMQ_EXCHANGE,
  );
  const consumer = new RabbitMQEventConsumer(
    Environment.RABBITMQ_URL,
    Environment.RABBITMQ_EXCHANGE,
    Environment.SERVICE_NAME,
  );

  const executeTaggingHandler = new ExecuteTaggingHandler(
    repository,
    dispatcher,
    tagGenerator,
    logger,
  );
  const tagPostHandler = new TagPostHandler(repository, dispatcher, logger);

  const postChangedEventHandler = new PostChangedEventHandler(tagPostHandler, logger);
  const taggingInitializedEventHandler = new TaggingInitializedEventHandler(
    executeTaggingHandler,
    logger,
  );
  const taggingFailedEventHandler = new TaggingFailedEventHandler(executeTaggingHandler, logger);

  await consumer.subscribe('PostCreated', postChangedEventHandler);
  await consumer.subscribe('PostUpdated', postChangedEventHandler);
  await consumer.subscribe('TaggingInitialized', taggingInitializedEventHandler);
  await consumer.subscribe('TaggingFailed', taggingFailedEventHandler);

  logger.info(`${Environment.SERVICE_NAME} started`, {
    subscriptions: ['PostCreated', 'PostUpdated', 'TaggingInitialized', 'TaggingFailed'],
  });
}

main().catch((error) => {
  logger.error(`Failed to start ${Environment.SERVICE_NAME}`, {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
