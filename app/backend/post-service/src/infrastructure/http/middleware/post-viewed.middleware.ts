import { type EventDispatcher, type Logger } from '@drift/shared';
import type { NextFunction, Request, Response } from 'express';

import PostViewedEvent from '../event/post-viewed.event';

export default class PostViewedMiddleware {
  constructor(
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  handle = (req: Request, _res: Response, next: NextFunction): void => {
    const id = typeof req.params.id === 'string' ? req.params.id : undefined;
    const clientHash = req.headers['x-client-hash'] as string;

    if (!id || !clientHash) {
      this.logger.warn('PostViewed skipped: missing required fields', { postId: id, clientHash });
      next();
      return;
    }

    const event = new PostViewedEvent({
      postId: id,
      clientHash,
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
