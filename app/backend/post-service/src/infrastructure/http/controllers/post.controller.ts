import type { Request, Response, NextFunction } from 'express';
import type CreatePostUseCase from '../../../application/usecase/create-post/create-post.use-case';
import type DeletePostUseCase from '../../../application/usecase/delete-post/delete-post.use-case';
import type UpdatePostUseCase from '../../../application/usecase/update-post/update-post.use-case';
import type GetPostUseCase from '../../../application/usecase/get-post/get-post.use-case';
import type ListPostUseCase from '../../../application/usecase/list-post/list-post.use-case';

interface CreatePostBody {
  clientId: string;
  clientName: string;
  title: string;
  body: string;
}

interface UpdatePostBody {
  clientId: string;
  title?: string;
  body?: string;
}

interface DeletePostBody {
  clientId: string;
}

export default class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    private readonly getPostUseCase: GetPostUseCase,
    private readonly listPostUseCase: ListPostUseCase,
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, clientName, title, body } = req.body as CreatePostBody;

      const result = await this.createPostUseCase.execute({ clientId, clientName, title, body });

      res.status(201).json({ postId: result.postId });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      const { clientId, title, body } = req.body as UpdatePostBody;

      await this.updatePostUseCase.execute({ postId: id, clientId, title, body });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      const { clientId } = req.body as DeletePostBody;

      await this.deletePostUseCase.execute({ postId: id, clientId });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);

      const post = await this.getPostUseCase.execute({ postId: id });

      res.status(200).json(post);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      const posts = await this.listPostUseCase.execute({ limit, offset });

      res.status(200).json(posts);
    } catch (error) {
      next(error);
    }
  }
}
