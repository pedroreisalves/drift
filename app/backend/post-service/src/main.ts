import express from 'express';
import { Pool } from 'pg';
import Environment from './infrastructure/config/environment';

import RabbitMQEventDispatcher from './infrastructure/messaging/rabbitmq-event-dispatcher';
import RabbitMQEventConsumer from './infrastructure/messaging/rabbitmq-event-consumer';
import PinoLogger from './infrastructure/logging/pino-logger';

import CreatePostHandler from './application/command/create-post/create-post.handler';
import UpdatePostHandler from './application/command/update-post/update-post.handler';
import DeletePostHandler from './application/command/delete-post/delete-post.handler';
import UpdatePostTagsHandler from './application/command/update-post-tags/update-post-tags.handler';

import PostTaggedEventHandler from './application/event-handler/post-tagged.event-handler';

import PostViewedMiddleware from './infrastructure/http/middleware/post-viewed.middleware';
import PostgresPostRepository from './infrastructure/persistence/postgres-post.repository';
import GetPostHandler from './application/query/get-post/get-post.handler';
import ListPostHandler from './application/query/list-post/list-post.handler';
import PostController from './infrastructure/http/controllers/post.controller';
import createPostRoutes from './infrastructure/http/routes/post.routes';
import createErrorMiddleware from './infrastructure/http/middleware/error.middleware';

const logger = new PinoLogger(Environment.SERVICE_NAME);

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: Environment.DB_URL });
  const repository = new PostgresPostRepository(pool);
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

  const createPostHandler = new CreatePostHandler(repository, dispatcher, logger);
  const updatePostHandler = new UpdatePostHandler(repository, dispatcher, logger);
  const deletePostHandler = new DeletePostHandler(repository, dispatcher, logger);
  const updatePostTagsHandler = new UpdatePostTagsHandler(repository, dispatcher, logger);

  const getPostHandler = new GetPostHandler(repository, logger);
  const listPostHandler = new ListPostHandler(repository, logger);

  const postTaggedEventHandler = new PostTaggedEventHandler(updatePostTagsHandler, repository, logger);

  await consumer.subscribe('PostTagged', postTaggedEventHandler);

  const controller = new PostController(
    createPostHandler,
    updatePostHandler,
    deletePostHandler,
    getPostHandler,
    listPostHandler,
  );
  const postViewedMiddleware = new PostViewedMiddleware(dispatcher, logger);
  const routes = createPostRoutes(controller, postViewedMiddleware);

  const app = express();
  app.use(express.json());
  app.use(routes);
  app.use(createErrorMiddleware(logger));

  logger.info(`${Environment.SERVICE_NAME} started`, {
    subscriptions: ['PostTagged'],
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
