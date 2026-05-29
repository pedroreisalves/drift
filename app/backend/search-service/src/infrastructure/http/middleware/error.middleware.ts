import { type Logger } from '@drift/shared';
import type { NextFunction, Request, Response } from 'express';

export default function createErrorMiddleware(logger: Logger) {
  return function errorMiddleware(
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    logger.error('Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  };
}
