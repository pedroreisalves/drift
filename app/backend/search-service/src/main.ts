import express from 'express';
import { Meilisearch } from 'meilisearch';
import Environment from './infrastructure/config/environment';

import { RabbitMQEventDispatcher, RabbitMQEventConsumer, PinoLogger } from '@drift/shared';

import IndexPostUseCase from './application/usecase/index-post/index-post.use-case';
import RemovePostFromIndexUseCase from './application/usecase/remove-post-from-index/remove-post-from-index.use-case';
import UpdatePostIndexUseCase from './application/usecase/update-post-index/update-post-index.use-case';
import IndexPostTagsUseCase from './application/usecase/index-post-tags/index-post-tags.use-case';
import SearchPostsUseCase from './application/usecase/search-posts/search-posts.use-case';

import PostCreatedEventHandler from './application/event-handler/post-created/post-created.event-handler';
import PostUpdatedEventHandler from './application/event-handler/post-updated/post-updated.event-handler';
import PostDeletedEventHandler from './application/event-handler/post-deleted/post-deleted.event-handler';
import PostTagsUpdatedEventHandler from './application/event-handler/post-tags-updated/post-tags-updated.event-handler';

import MeilisearchSearchEntryRepository from './infrastructure/persistence/meilisearch-search-entry.repository';
import SearchController from './infrastructure/http/controllers/search.controller';
import createSearchRoutes from './infrastructure/http/routes/search.routes';
import createErrorMiddleware from './infrastructure/http/middleware/error.middleware';

const logger = new PinoLogger(Environment.SERVICE_NAME, Environment.LOG_LEVEL);

async function main(): Promise<void> {
  const meiliClient = new Meilisearch({ host: Environment.MEILISEARCH_URL });
  const repository = new MeilisearchSearchEntryRepository(meiliClient);

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

  const indexPostUseCase = new IndexPostUseCase(repository, dispatcher, logger);
  const removePostFromIndexUseCase = new RemovePostFromIndexUseCase(repository, dispatcher, logger);
  const updatePostIndexUseCase = new UpdatePostIndexUseCase(repository, dispatcher, logger);
  const indexPostTagsUseCase = new IndexPostTagsUseCase(repository, dispatcher, logger);
  const searchPostsUseCase = new SearchPostsUseCase(repository, dispatcher, logger);

  const postCreatedEventHandler = new PostCreatedEventHandler(indexPostUseCase, logger);
  const postUpdatedEventHandler = new PostUpdatedEventHandler(updatePostIndexUseCase, logger);
  const postDeletedEventHandler = new PostDeletedEventHandler(removePostFromIndexUseCase, logger);
  const postTagsUpdatedEventHandler = new PostTagsUpdatedEventHandler(indexPostTagsUseCase, logger);

  await consumer.subscribe('PostCreated', postCreatedEventHandler);
  await consumer.subscribe('PostUpdated', postUpdatedEventHandler);
  await consumer.subscribe('PostDeleted', postDeletedEventHandler);
  await consumer.subscribe('PostTagsUpdated', postTagsUpdatedEventHandler);

  const controller = new SearchController(searchPostsUseCase);
  const routes = createSearchRoutes(controller);

  const app = express();
  app.use(express.json());
  app.use(routes);
  app.use(createErrorMiddleware(logger));

  logger.info(`${Environment.SERVICE_NAME} started`, {
    subscriptions: ['PostCreated', 'PostUpdated', 'PostDeleted', 'PostTagsUpdated'],
  });

  app.listen(Environment.PORT, () => {
    logger.info('HTTP server running', { port: Environment.PORT });
  });
}

main().catch((error) => {
  logger.error(`Failed to start ${Environment.SERVICE_NAME}`, {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
