import type { DomainEvent, EventDispatcher, Logger, UseCase } from '@drift/shared';

import type PostRepository from '../../../domain/post/repository/post.repository';
import type PostFeaturedRepository from '../../../domain/post/repository/post-featured.repository';
import {
  FEATURED_EXPIRY_DEMOTION_REASON,
  FEATURED_MAX_AGE_MS,
} from '../../@shared/constant/check-featured-expiry.constant';

export default class CheckFeaturedExpiryUseCase implements UseCase<void, void> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly postFeaturedRepository: PostFeaturedRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(): Promise<void> {
    const startedAt = Date.now();
    const now = new Date();

    const featured = await this.postRepository.findAllFeatured();

    const expired = featured.filter(
      (post) =>
        post.engagementDropFlagged &&
        post.featuredAt !== null &&
        now.getTime() - post.featuredAt.getTime() > FEATURED_MAX_AGE_MS,
    );

    this.logger.info('Checking featured expiry', {
      featuredCount: featured.length,
      expiredCandidateCount: expired.length,
    });

    if (expired.length === 0) {
      this.logger.info('Featured expiry check complete', {
        demotedCount: 0,
        durationMs: Date.now() - startedAt,
      });
      return;
    }

    const events: DomainEvent[] = [];

    for (const post of expired) {
      post.demote(FEATURED_EXPIRY_DEMOTION_REASON);
      events.push(...post.getDomainEvents());
    }

    await Promise.all(expired.map((post) => this.postRepository.save(post)));
    await Promise.all(expired.map((post) => this.postFeaturedRepository.delete(post.id)));
    await Promise.all(events.map((event) => this.eventDispatcher.dispatch(event)));

    for (const post of expired) {
      post.clearDomainEvents();
    }

    this.logger.info('Featured expiry check complete', {
      demotedCount: expired.length,
      durationMs: Date.now() - startedAt,
    });
  }
}
