import type { Request, Response, NextFunction } from 'express';
import { type Logger } from '@drift/shared';
import InvalidSearchEntryError from '../../../domain/search-entry/error/invalid-search-entry.error';
import DocumentNotFoundError from '../../../application/@shared/error/document-not-found.error';
import IndexingFailedError from '../../../application/@shared/error/indexing-failed.error';

export default function createErrorMiddleware(logger: Logger) {
  return function errorMiddleware(
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    if (error instanceof InvalidSearchEntryError) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (error instanceof DocumentNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }

    if (error instanceof IndexingFailedError) {
      res.status(500).json({ error: error.message });
      return;
    }

    logger.error('Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  };
}
