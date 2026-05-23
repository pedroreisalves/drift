import { z } from 'zod';
import { type EventHandler, type Logger } from '@drift/shared';
import type PromotePostUseCase from '../../usecase/promote-post/promote-post.use-case';
import PostNotFoundError from '../../@shared/error/post-not-found.error';

export const postEngagementRaisedMessageSchema = z.object({
  eventName: z.literal('PostEngagementRaised'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    viewCount: z.number().int().nonnegative(),
    windowHours: z.number().int().positive(),
    raisedAt: z.iso.datetime(),
  }),
});

export type PostEngagementRaisedMessage = z.infer<typeof postEngagementRaisedMessageSchema>;

export default class PostEngagementRaisedEventHandler implements EventHandler {
  constructor(
    private readonly promotePostUseCase: PromotePostUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postEngagementRaisedMessageSchema.parse(raw);
    const { postId } = event.payload;

    this.logger.info('Received PostEngagementRaised, promoting post', { postId });

    try {
      await this.promotePostUseCase.execute({ postId });
    } catch (error) {
      if (error instanceof PostNotFoundError) {
        this.logger.warn('Dropping PostEngagementRaised: post no longer exists', { postId });
        return;
      }
      throw error;
    }
  }
}
