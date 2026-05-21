import { z } from 'zod';
import { type EventHandler } from '@drift/shared';
import type TagPostUseCase from '../../usecase/tag-post/tag-post.use-case';
import { type Logger } from '@drift/shared';

export const postChangedMessageSchema = z.object({
  eventName: z.union([z.literal('PostCreated'), z.literal('PostUpdated')]),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    clientId: z.uuidv7(),
    clientName: z.string(),
    title: z.string(),
    body: z.string(),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
  }),
});

export type PostChangedMessage = z.infer<typeof postChangedMessageSchema>;

export default class PostChangedEventHandler implements EventHandler {
  constructor(
    private readonly tagPostUseCase: TagPostUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postChangedMessageSchema.parse(raw);
    const { postId, title, body } = event.payload;

    this.logger.info('Received post changed event', {
      eventName: event.eventName,
      postId,
    });

    await this.tagPostUseCase.execute({ postId, title, body });
  }
}
