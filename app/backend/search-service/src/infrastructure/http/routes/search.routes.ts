import { Router } from 'express';
import type SearchController from '../controllers/search.controller';

export default function createSearchRoutes(controller: SearchController): Router {
  const router = Router();

  router.get('/search', (req, res, next) => controller.search(req, res, next));

  return router;
}
