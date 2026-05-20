import { Pool } from 'pg';
import Environment from './infrastructure/config/environment';

import { RabbitMQEventDispatcher } from '@drift/shared';
import { RabbitMQEventConsumer } from '@drift/shared';
import PostgresTaggingProcessRepository from './infrastructure/persistence/postgres-tagging-process.repository';
import OllamaTagGenerator from './infrastructure/llm/ollama-tag-generator';
import { PinoLogger } from '@drift/shared';
import ExecuteTaggingUseCase from './application/usecase/execute-tagging/execute-tagging.use-case';
import TagPostUseCase from './application/usecase/tag-post/tag-post.use-case';
import PostChangedEventHandler from './application/event-handler/post-changed/post-changed.event-handler';
import TaggingInitializedEventHandler from './application/event-handler/tagging-initialized/tagging-initialized.event-handler';
import TaggingFailedEventHandler from './application/event-handler/tagging-failed/tagging-failed.event-handler';

const logger = new PinoLogger(Environment.SERVICE_NAME, Environment.LOG_LEVEL);

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
    logger,
  );

  const executeTaggingUseCase = new ExecuteTaggingUseCase(
    repository,
    dispatcher,
    tagGenerator,
    logger,
  );
  const tagPostUseCase = new TagPostUseCase(repository, dispatcher, logger);

  const postChangedEventHandler = new PostChangedEventHandler(tagPostUseCase, logger);
  const taggingInitializedEventHandler = new TaggingInitializedEventHandler(
    executeTaggingUseCase,
    logger,
  );
  const taggingFailedEventHandler = new TaggingFailedEventHandler(executeTaggingUseCase, logger);

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
