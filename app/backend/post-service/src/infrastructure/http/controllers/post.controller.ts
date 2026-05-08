import type { Request, Response, NextFunction } from 'express';
import CreatePostCommand from '../../../application/command/create-post/create-post.command';
import type CreatePostHandler from '../../../application/command/create-post/create-post.handler';
import DeletePostCommand from '../../../application/command/delete-post/delete-post.command';
import type DeletePostHandler from '../../../application/command/delete-post/delete-post.handler';
import UpdatePostCommand from '../../../application/command/update-post/update-post.command';
import type UpdatePostHandler from '../../../application/command/update-post/update-post.handler';
import type GetPostHandler from '../../../application/queries/get-post/get-post.handler';
import GetPostQuery from '../../../application/queries/get-post/get-post.query';
import type ListPostHandler from '../../../application/queries/list-post/list-post.handler';
import ListPostQuery from '../../../application/queries/list-post/list-post.query';

export default class PostController {
  constructor(
    private readonly createPostHandler: CreatePostHandler,
    private readonly updatePostHandler: UpdatePostHandler,
    private readonly deletePostHandler: DeletePostHandler,
    private readonly getPostHandler: GetPostHandler,
    private readonly listPostHandler: ListPostHandler,
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, clientName, title, body } = req.body;

      const command = new CreatePostCommand(clientId, clientName, title, body);
      const postId = await this.createPostHandler.execute(command);

      res.status(201).json({ postId });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { clientId, clientName, title, body } = req.body;

      const command = new UpdatePostCommand(id as string, clientId, clientName, title, body);
      await this.updatePostHandler.execute(command);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { clientId } = req.body;

      const command = new DeletePostCommand(id as string, clientId);
      await this.deletePostHandler.execute(command);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const query = new GetPostQuery(id as string);
      const post = await this.getPostHandler.execute(query);

      res.status(200).json(post);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      const query = new ListPostQuery(limit, offset);
      const posts = await this.listPostHandler.execute(query);

      res.status(200).json(posts);
    } catch (error) {
      next(error);
    }
  }
}
