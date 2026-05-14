import type { Request, Response, NextFunction } from 'express';
import SearchPostsQuery from '../../../application/query/search-posts/search-posts.command';
import type SearchPostsHandler from '../../../application/query/search-posts/search-posts.handler';

export default class SearchController {
  constructor(private readonly searchPostsHandler: SearchPostsHandler) {}

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string;
      const clientId = req.query.clientId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const query = new SearchPostsQuery(q, clientId, limit, offset);
      const results = await this.searchPostsHandler.execute(query);

      res.status(200).json({ results });
    } catch (error) {
      next(error);
    }
  }
}
