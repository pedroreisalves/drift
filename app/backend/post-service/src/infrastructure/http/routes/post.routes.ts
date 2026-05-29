import { Router } from 'express';

import type PostController from '../controllers/post.controller';
import type PostViewedMiddleware from '../middleware/post-viewed.middleware';

export default function createPostRoutes(
  controller: PostController,
  postViewedMiddleware: PostViewedMiddleware,
): Router {
  const router = Router();

  router.post('/posts', (req, res, next) => controller.create(req, res, next));
  router.put('/posts/:id', (req, res, next) => controller.update(req, res, next));
  router.delete('/posts/:id', (req, res, next) => controller.delete(req, res, next));
  router.get('/posts/:id', postViewedMiddleware.handle, (req, res, next) =>
    controller.getById(req, res, next),
  );
  router.get('/posts', (req, res, next) => controller.list(req, res, next));

  return router;
}
