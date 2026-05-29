import { type EventHandler, type Logger } from '@drift/shared';
import { z } from 'zod';

import PostNotFoundError from '../../@shared/error/post-not-found.error';
import type FlagPostEngagementDropUseCase from '../../usecase/flag-post-engagement-drop/flag-post-engagement-drop.use-case';

export const postEngagementDroppedMessageSchema = z.object({
  eventName: z.literal('PostEngagementDropped'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    viewCount: z.number().int().nonnegative(),
    windowHours: z.number().int().positive(),
    droppedAt: z.iso.datetime(),
  }),
});

export type PostEngagementDroppedMessage = z.infer<typeof postEngagementDroppedMessageSchema>;

export default class PostEngagementDroppedEventHandler implements EventHandler {
  constructor(
    private readonly flagPostEngagementDropUseCase: FlagPostEngagementDropUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postEngagementDroppedMessageSchema.parse(raw);
    const { postId } = event.payload;

    this.logger.info('Received PostEngagementDropped, flagging engagement drop', { postId });

    try {
      await this.flagPostEngagementDropUseCase.execute({ postId });
    } catch (error) {
      if (error instanceof PostNotFoundError) {
        this.logger.warn('Dropping PostEngagementDropped: post no longer exists', { postId });
        return;
      }
      throw error;
    }
  }
}
