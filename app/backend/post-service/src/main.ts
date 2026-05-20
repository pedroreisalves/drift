import express from 'express';
import { Pool } from 'pg';
import Environment from './infrastructure/config/environment';

import { RabbitMQEventDispatcher } from '@drift/shared';
import { RabbitMQEventConsumer } from '@drift/shared';
import { PinoLogger } from '@drift/shared';

import CreatePostUseCase from './application/usecase/create-post/create-post.use-case';
import UpdatePostUseCase from './application/usecase/update-post/update-post.use-case';
import DeletePostUseCase from './application/usecase/delete-post/delete-post.use-case';
import UpdatePostTagsUseCase from './application/usecase/update-post-tags/update-post-tags.use-case';
import LockPostForTaggingUseCase from './application/usecase/lock-post-for-tagging/lock-post-for-tagging.use-case';
import UnlockPostForTaggingUseCase from './application/usecase/unlock-post-for-tagging/unlock-post-for-tagging.use-case';

import PostTaggedEventHandler from './application/event-handler/post-tagged/post-tagged.event-handler';
import TaggingInitializedEventHandler from './application/event-handler/tagging-initialized/tagging-initialized.event-handler';
import TaggingAbandonedEventHandler from './application/event-handler/tagging-abandoned/tagging-abandoned.event-handler';

import PostgresPostLockRepository from './infrastructure/persistence/postgres-post-lock.repository';

import PostViewedMiddleware from './infrastructure/http/middleware/post-viewed.middleware';
import PostgresPostRepository from './infrastructure/persistence/postgres-post.repository';
import GetPostUseCase from './application/usecase/get-post/get-post.use-case';
import ListPostUseCase from './application/usecase/list-post/list-post.use-case';
import PostController from './infrastructure/http/controllers/post.controller';
import createPostRoutes from './infrastructure/http/routes/post.routes';
import createErrorMiddleware from './infrastructure/http/middleware/error.middleware';

const logger = new PinoLogger(Environment.SERVICE_NAME, Environment.LOG_LEVEL);

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: Environment.DB_URL });
  const repository = new PostgresPostRepository(pool);
  const postLockRepository = new PostgresPostLockRepository(pool);
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

  const createPostUseCase = new CreatePostUseCase(repository, dispatcher, logger);
  const updatePostUseCase = new UpdatePostUseCase(
    repository,
    postLockRepository,
    dispatcher,
    logger,
  );
  const deletePostUseCase = new DeletePostUseCase(repository, dispatcher, logger);
  const updatePostTagsUseCase = new UpdatePostTagsUseCase(repository, dispatcher, logger);
  const lockPostForTaggingUseCase = new LockPostForTaggingUseCase(postLockRepository, logger);
  const unlockPostForTaggingUseCase = new UnlockPostForTaggingUseCase(postLockRepository, logger);

  const getPostUseCase = new GetPostUseCase(repository, logger);
  const listPostUseCase = new ListPostUseCase(repository, logger);

  const postTaggedEventHandler = new PostTaggedEventHandler(
    updatePostTagsUseCase,
    unlockPostForTaggingUseCase,
    logger,
  );
  const taggingInitializedEventHandler = new TaggingInitializedEventHandler(
    lockPostForTaggingUseCase,
    logger,
  );
  const taggingAbandonedEventHandler = new TaggingAbandonedEventHandler(
    unlockPostForTaggingUseCase,
    logger,
  );

  await consumer.subscribe('PostTagged', postTaggedEventHandler);
  await consumer.subscribe('TaggingInitialized', taggingInitializedEventHandler);
  await consumer.subscribe('TaggingAbandoned', taggingAbandonedEventHandler);

  const controller = new PostController(
    createPostUseCase,
    updatePostUseCase,
    deletePostUseCase,
    getPostUseCase,
    listPostUseCase,
  );
  const postViewedMiddleware = new PostViewedMiddleware(dispatcher, logger);
  const routes = createPostRoutes(controller, postViewedMiddleware);

  const app = express();
  app.use(express.json());
  app.use(routes);
  app.use(createErrorMiddleware(logger));

  logger.info(`${Environment.SERVICE_NAME} started`, {
    subscriptions: ['PostTagged', 'TaggingInitialized', 'TaggingAbandoned'],
  });

  app.listen(Environment.PORT, () => {
    logger.info(`HTTP server running`, { port: Environment.PORT });
  });
}

main().catch((error) => {
  logger.error(`Failed to start ${Environment.SERVICE_NAME}`, {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
