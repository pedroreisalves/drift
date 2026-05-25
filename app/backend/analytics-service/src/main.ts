import { Pool } from 'pg';
import Environment from './infrastructure/config/environment';

import {
  RabbitMQEventDispatcher,
  RabbitMQEventConsumer,
  PinoLogger,
  NodeCronScheduler,
} from '@drift/shared';
import PostgresAnalyticsLogRepository from './infrastructure/persistence/postgres-analytics-log.repository';
import PostgresEngagementStateRepository from './infrastructure/persistence/postgres-engagement-state.repository';
import PostgresDeletedPostRepository from './infrastructure/persistence/postgres-deleted-post.repository';
import PostgresPostOwnerRepository from './infrastructure/persistence/postgres-post-owner.repository';
import RecordAnalyticsEventUseCase from './application/usecase/record-analytics-event/record-analytics-event.use-case';
import CheckEngagementUseCase from './application/usecase/check-engagement/check-engagement.use-case';
import PostCreatedEventHandler from './application/event-handler/post-created/post-created.event-handler';
import PostUpdatedEventHandler from './application/event-handler/post-updated/post-updated.event-handler';
import PostViewedEventHandler from './application/event-handler/post-viewed/post-viewed.event-handler';
import PostSearchedEventHandler from './application/event-handler/post-searched/post-searched.event-handler';
import PostDeletedEventHandler from './application/event-handler/post-deleted/post-deleted.event-handler';

const logger = new PinoLogger(Environment.SERVICE_NAME, Environment.LOG_LEVEL);

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: Environment.DB_URL });

  const analyticsLogRepository = new PostgresAnalyticsLogRepository(pool);
  const engagementStateRepository = new PostgresEngagementStateRepository(pool);
  const deletedPostRepository = new PostgresDeletedPostRepository(pool);
  const postOwnerRepository = new PostgresPostOwnerRepository(pool);

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

  const recordAnalyticsEventUseCase = new RecordAnalyticsEventUseCase(
    analyticsLogRepository,
    deletedPostRepository,
    postOwnerRepository,
    dispatcher,
    logger,
  );
  const checkEngagementUseCase = new CheckEngagementUseCase(
    analyticsLogRepository,
    engagementStateRepository,
    dispatcher,
    logger,
  );

  const postCreatedEventHandler = new PostCreatedEventHandler(recordAnalyticsEventUseCase, logger);
  const postUpdatedEventHandler = new PostUpdatedEventHandler(recordAnalyticsEventUseCase, logger);
  const postViewedEventHandler = new PostViewedEventHandler(recordAnalyticsEventUseCase, logger);
  const postSearchedEventHandler = new PostSearchedEventHandler(
    recordAnalyticsEventUseCase,
    logger,
  );
  const postDeletedEventHandler = new PostDeletedEventHandler(recordAnalyticsEventUseCase, logger);

  await consumer.subscribe('PostCreated', postCreatedEventHandler);
  await consumer.subscribe('PostUpdated', postUpdatedEventHandler);
  await consumer.subscribe('PostViewed', postViewedEventHandler);
  await consumer.subscribe('PostSearched', postSearchedEventHandler);
  await consumer.subscribe('PostDeleted', postDeletedEventHandler);

  const scheduler = new NodeCronScheduler();
  scheduler.schedule(
    '0 * * * *',
    () =>
      checkEngagementUseCase.execute().catch((err) =>
        logger.error('CheckEngagement scheduled run failed', {
          error: err instanceof Error ? err.message : String(err),
        }),
      ),
    { runAtStartup: true },
  );

  logger.info(`${Environment.SERVICE_NAME} started`, {
    subscriptions: ['PostCreated', 'PostUpdated', 'PostViewed', 'PostSearched', 'PostDeleted'],
    scheduler: 'CheckEngagement @ every hour',
  });
}

main().catch((error) => {
  logger.error(`Failed to start ${Environment.SERVICE_NAME}`, {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
