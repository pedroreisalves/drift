import { Request, Response, NextFunction } from 'express';
import { InvalidPostError } from '../../../domain/post/error/invalid-post.error';
import { InvalidPostTagsError } from '../../../domain/post/error/invalid-post-tags.error';
import { InvalidValueObjectError } from '../../../domain/@shared/error/invalid-value-object.error';
import { PostNotFoundError } from '../../../application/@shared/error/post-not-found.error';
import { ForbiddenPostUpdateError } from '../../../application/@shared/error/forbidden-post-update.error';

export default function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (
    error instanceof InvalidPostError ||
    error instanceof InvalidPostTagsError ||
    error instanceof InvalidValueObjectError
  ) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof PostNotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }

  if (error instanceof ForbiddenPostUpdateError) {
    res.status(403).json({ error: error.message });
    return;
  }

  console.error('Unexpected error:', error);
  res.status(500).json({ error: 'Internal server error' });
}
