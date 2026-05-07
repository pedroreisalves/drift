import { Request, Response, NextFunction } from 'express';
import EventDispatcher from '../../../application/@shared/interface/event-dispatcher.interface';
import PostViewedEvent from '../event/post-viewed.event';

export default class PostViewedMiddleware {
  constructor(private readonly eventDispatcher: EventDispatcher) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const clientId = req.headers['x-client-id'] as string;

    if (!id || !clientId) {
      next();
      return;
    }

    const event = new PostViewedEvent({
      postId: id as string,
      clientId,
      viewedAt: new Date().toISOString(),
    });

    this.eventDispatcher.dispatch(event).catch((error) => {
      console.error('Failed to dispatch PostViewed event:', error);
    });

    next();
  };
}
