import type { Request, Response, NextFunction } from 'express';
import { InvalidValueObjectError, type Logger } from '@drift/shared';
import InvalidPostError from '../../../domain/post/error/invalid-post.error';
import PostNotFoundError from '../../../application/@shared/error/post-not-found.error';
import { ForbiddenPostOperationError } from '../../../application/@shared/error/forbidden-post-update.error';
import TaggingInProgressError from '../../../application/@shared/error/tagging-in-progress.error';

export default function createErrorMiddleware(logger: Logger) {
  return function errorMiddleware(
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    if (error instanceof InvalidPostError || error instanceof InvalidValueObjectError) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (error instanceof PostNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }

    if (error instanceof ForbiddenPostOperationError) {
      res.status(403).json({ error: error.message });
      return;
    }

    if (error instanceof TaggingInProgressError) {
      res.status(409).json({ error: error.message });
      return;
    }

    logger.error('Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  };
}
