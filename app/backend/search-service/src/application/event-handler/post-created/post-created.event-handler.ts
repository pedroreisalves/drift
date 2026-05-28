import { z } from 'zod';
import { type EventHandler, type Logger } from '@drift/shared';
import type IndexPostUseCase from '../../usecase/index-post/index-post.use-case';

export const postCreatedMessageSchema = z.object({
  eventName: z.literal('PostCreated'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    postId: z.uuidv7(),
    clientId: z.uuidv7(),
    title: z.string(),
    body: z.string(),
    createdAt: z.iso.datetime(),
  }),
});

export type PostCreatedMessage = z.infer<typeof postCreatedMessageSchema>;

export default class PostCreatedEventHandler implements EventHandler {
  constructor(
    private readonly indexPostUseCase: IndexPostUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postCreatedMessageSchema.parse(raw);
    const { postId, title, body, createdAt } = event.payload;

    this.logger.info('Received PostCreated event, indexing post', { postId });

    await this.indexPostUseCase.execute({ postId, title, body, createdAt });
  }
}
