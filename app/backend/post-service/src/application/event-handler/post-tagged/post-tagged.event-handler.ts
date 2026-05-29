import { type EventHandler, type Logger } from '@drift/shared';
import { z } from 'zod';

import PostNotFoundError from '../../@shared/error/post-not-found.error';
import type UnlockPostForTaggingUseCase from '../../usecase/unlock-post-for-tagging/unlock-post-for-tagging.use-case';
import type UpdatePostTagsUseCase from '../../usecase/update-post-tags/update-post-tags.use-case';

export const postTaggedMessageSchema = z.object({
  eventName: z.literal('PostTagged'),
  occurredAt: z.iso.datetime(),
  payload: z.object({
    taggingProcessId: z.uuidv7(),
    postId: z.uuidv7(),
    tags: z.array(z.string()),
    taggedAt: z.iso.datetime(),
  }),
});

export type PostTaggedMessage = z.infer<typeof postTaggedMessageSchema>;

export default class PostTaggedEventHandler implements EventHandler {
  constructor(
    private readonly updatePostTagsUseCase: UpdatePostTagsUseCase,
    private readonly unlockPostForTaggingUseCase: UnlockPostForTaggingUseCase,
    private readonly logger: Logger,
  ) {}

  async handle(raw: unknown): Promise<void> {
    const event = postTaggedMessageSchema.parse(raw);
    const { postId, tags } = event.payload;

    this.logger.info('Received post tagged event, applying tags', {
      postId,
      tagCount: tags.length,
    });

    try {
      await this.updatePostTagsUseCase.execute({ postId, tags });
    } catch (error) {
      if (error instanceof PostNotFoundError) {
        this.logger.warn('Dropping PostTagged event: post no longer exists', { postId });
        await this.unlockPostForTaggingUseCase.execute({ postId });
        return;
      }
      throw error;
    }

    await this.unlockPostForTaggingUseCase.execute({ postId });
  }
}
