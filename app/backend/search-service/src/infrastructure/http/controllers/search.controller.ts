import type { NextFunction, Request, Response } from 'express';

import type SearchPostsUseCase from '../../../application/usecase/search-posts/search-posts.use-case';

export default class SearchController {
  constructor(private readonly searchPostsUseCase: SearchPostsUseCase) {}

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string;
      const clientHash = req.headers['x-client-hash'] as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const results = await this.searchPostsUseCase.execute({ q, clientHash, limit, offset });

      res.status(200).json({ results });
    } catch (error) {
      next(error);
    }
  }
}
