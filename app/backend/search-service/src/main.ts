import express from 'express';
import { Meilisearch } from 'meilisearch';
import Environment from './infrastructure/config/environment';

import { RabbitMQEventDispatcher } from '@drift/shared';
import { RabbitMQEventConsumer } from '@drift/shared';
import { PinoLogger } from '@drift/shared';

import IndexPostHandler from './application/command/index-post/index-post.handler';
import RemovePostFromIndexHandler from './application/command/remove-post-from-index/remove-post-from-index.handler';
import UpdatePostIndexHandler from './application/command/update-post-index/update-post-index.handler';
import IndexPostTagsHandler from './application/command/index-post-tags/index-post-tags.handler';
import SearchPostsHandler from './application/query/search-posts/search-posts.handler';

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

  const indexPostHandler = new IndexPostHandler(repository, dispatcher, logger);
  const removePostFromIndexHandler = new RemovePostFromIndexHandler(repository, dispatcher, logger);
  const updatePostIndexHandler = new UpdatePostIndexHandler(repository, dispatcher, logger);
  const indexPostTagsHandler = new IndexPostTagsHandler(repository, dispatcher, logger);
  const searchPostsHandler = new SearchPostsHandler(repository, dispatcher, logger);

  const postCreatedEventHandler = new PostCreatedEventHandler(indexPostHandler, logger);
  const postUpdatedEventHandler = new PostUpdatedEventHandler(updatePostIndexHandler, logger);
  const postDeletedEventHandler = new PostDeletedEventHandler(removePostFromIndexHandler, logger);
  const postTagsUpdatedEventHandler = new PostTagsUpdatedEventHandler(indexPostTagsHandler, logger);

  await consumer.subscribe('PostCreated', postCreatedEventHandler);
  await consumer.subscribe('PostUpdated', postUpdatedEventHandler);
  await consumer.subscribe('PostDeleted', postDeletedEventHandler);
  await consumer.subscribe('PostTagsUpdated', postTagsUpdatedEventHandler);

  const controller = new SearchController(searchPostsHandler);
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
