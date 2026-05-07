import express from 'express';
import { Pool } from 'pg';
import { Environment } from './infrastructure/config/environment';

import RabbitMQEventDispatcher from './infrastructure/messaging/rabbitmq-event-dispatcher';
import RabbitMQEventConsumer from './infrastructure/messaging/rabbitmq-event-consumer';

import CreatePostHandler from './application/command/create-post/create-post.handler';
import UpdatePostHandler from './application/command/update-post/update-post.handler';
import DeletePostHandler from './application/command/delete-post/delete-post.handler';
import UpdatePostTagsHandler from './application/command/update-post-tags/update-post-tags.handler';

import { PostTaggedEventHandler } from './application/event-handler/post-tagged.event-handler';

import PostViewedMiddleware from './infrastructure/http/middleware/post-viewed.middleware';
import PostgresPostRepository from './infrastructure/persistence/postgres-post.repository';
import GetPostHandler from './application/queries/get-post/get-post.handler';
import ListPostHandler from './application/queries/list-post/list-post.handler';
import PostController from './infrastructure/http/controllers/post.controller';
import createPostRoutes from './infrastructure/http/routes/post.routes';
import errorMiddleware from './infrastructure/http/middleware/error.middleware';

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
    'post-service',
  );

  const createPostHandler = new CreatePostHandler(repository, dispatcher);
  const updatePostHandler = new UpdatePostHandler(repository, dispatcher);
  const deletePostHandler = new DeletePostHandler(repository, dispatcher);
  const updatePostTagsHandler = new UpdatePostTagsHandler(repository, dispatcher);

  const getPostHandler = new GetPostHandler(repository);
  const listPostHandler = new ListPostHandler(repository);

  const postTaggedEventHandler = new PostTaggedEventHandler(updatePostTagsHandler);

  await consumer.subscribe('PostTagged', postTaggedEventHandler);

  const controller = new PostController(
    createPostHandler,
    updatePostHandler,
    deletePostHandler,
    getPostHandler,
    listPostHandler,
  );
  const postViewedMiddleware = new PostViewedMiddleware(dispatcher);
  const routes = createPostRoutes(controller, postViewedMiddleware);

  const app = express();
  app.use(express.json());
  app.use(routes);
  app.use(errorMiddleware);

  app.listen(Environment.PORT, () => {
    console.log(`Post Service running on port ${Environment.PORT}`);
  });
}

main().catch((error) => {
  console.error('Failed to start Post Service:', error);
  process.exit(1);
});
