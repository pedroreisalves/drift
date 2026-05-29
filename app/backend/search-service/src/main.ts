import { PinoLogger, RabbitMQEventConsumer, RabbitMQEventDispatcher } from '@drift/shared';
import express from 'express';
import { Meilisearch } from 'meilisearch';

import PostCreatedEventHandler from './application/event-handler/post-created/post-created.event-handler';
import PostDeletedEventHandler from './application/event-handler/post-deleted/post-deleted.event-handler';
import PostDemotedEventHandler from './application/event-handler/post-demoted/post-demoted.event-handler';
import PostPromotedEventHandler from './application/event-handler/post-promoted/post-promoted.event-handler';
import PostTagsUpdatedEventHandler from './application/event-handler/post-tags-updated/post-tags-updated.event-handler';
import PostUpdatedEventHandler from './application/event-handler/post-updated/post-updated.event-handler';
import TaggingAbandonedEventHandler from './application/event-handler/tagging-abandoned/tagging-abandoned.event-handler';
import IndexPostUseCase from './application/usecase/index-post/index-post.use-case';
import IndexPostTagsUseCase from './application/usecase/index-post-tags/index-post-tags.use-case';
import RemovePostFromIndexUseCase from './application/usecase/remove-post-from-index/remove-post-from-index.use-case';
import SearchPostsUseCase from './application/usecase/search-posts/search-posts.use-case';
import UpdatePostIndexUseCase from './application/usecase/update-post-index/update-post-index.use-case';
import UpdateSearchEntryFeaturedStatusUseCase from './application/usecase/update-search-entry-featured-status/update-search-entry-featured-status.use-case';
import UpdateSearchEntryTaggingStatusUseCase from './application/usecase/update-search-entry-tagging-status/update-search-entry-tagging-status.use-case';
import Environment from './infrastructure/config/environment';
import SearchController from './infrastructure/http/controllers/search.controller';
import createErrorMiddleware from './infrastructure/http/middleware/error.middleware';
import createSearchRoutes from './infrastructure/http/routes/search.routes';
import MeilisearchSearchEntryRepository from './infrastructure/persistence/meilisearch-search-entry.repository';

const logger = new PinoLogger(Environment.SERVICE_NAME, Environment.LOG_LEVEL);

async function main(): Promise<void> {
  const meiliClient = new Meilisearch({ host: Environment.MEILISEARCH_URL });
  const repository = new MeilisearchSearchEntryRepository(meiliClient);
  await repository.init();

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
  const updateSearchEntryFeaturedStatusUseCase = new UpdateSearchEntryFeaturedStatusUseCase(
    repository,
    logger,
  );
  const updateSearchEntryTaggingStatusUseCase = new UpdateSearchEntryTaggingStatusUseCase(
    repository,
    logger,
  );

  const postCreatedEventHandler = new PostCreatedEventHandler(indexPostUseCase, logger);
  const postUpdatedEventHandler = new PostUpdatedEventHandler(updatePostIndexUseCase, logger);
  const postDeletedEventHandler = new PostDeletedEventHandler(removePostFromIndexUseCase, logger);
  const postTagsUpdatedEventHandler = new PostTagsUpdatedEventHandler(indexPostTagsUseCase, logger);
  const postPromotedEventHandler = new PostPromotedEventHandler(
    updateSearchEntryFeaturedStatusUseCase,
    logger,
  );
  const postDemotedEventHandler = new PostDemotedEventHandler(
    updateSearchEntryFeaturedStatusUseCase,
    logger,
  );
  const taggingAbandonedEventHandler = new TaggingAbandonedEventHandler(
    updateSearchEntryTaggingStatusUseCase,
    logger,
  );

  await consumer.subscribe('PostCreated', postCreatedEventHandler);
  await consumer.subscribe('PostUpdated', postUpdatedEventHandler);
  await consumer.subscribe('PostDeleted', postDeletedEventHandler);
  await consumer.subscribe('PostTagsUpdated', postTagsUpdatedEventHandler);
  await consumer.subscribe('PostPromoted', postPromotedEventHandler);
  await consumer.subscribe('PostDemoted', postDemotedEventHandler);
  await consumer.subscribe('TaggingAbandoned', taggingAbandonedEventHandler);

  const controller = new SearchController(searchPostsUseCase);
  const routes = createSearchRoutes(controller);

  const app = express();
  app.use(express.json());
  app.use(routes);
  app.use(createErrorMiddleware(logger));

  logger.info(`${Environment.SERVICE_NAME} started`, {
    subscriptions: [
      'PostCreated',
      'PostUpdated',
      'PostDeleted',
      'PostTagsUpdated',
      'PostPromoted',
      'PostDemoted',
      'TaggingAbandoned',
    ],
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
