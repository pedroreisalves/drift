import { type EventDispatcher, type Logger } from '@drift/shared';
import type { NextFunction, Request, Response } from 'express';

import PostViewedEvent from '../event/post-viewed.event';

export default class PostViewedMiddleware {
  constructor(
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  handle = (req: Request, _res: Response, next: NextFunction): void => {
    const { id } = req.params;
    const clientId = req.headers['x-client-id'] as string;

    if (!id || !clientId) {
      this.logger.warn('PostViewed skipped: missing required fields', {
        postId: id,
        clientId: clientId,
      });
      next();
      return;
    }

    const event = new PostViewedEvent({
      postId: id as string,
      clientId,
      viewedAt: new Date().toISOString(),
    });

    this.eventDispatcher.dispatch(event).catch((error: unknown) => {
      this.logger.error('Failed to dispatch PostViewed event', {
        postId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    next();
  };
}
