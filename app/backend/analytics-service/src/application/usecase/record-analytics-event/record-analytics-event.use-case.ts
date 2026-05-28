import { ClientId, PostId, type EventDispatcher, type Logger, type UseCase } from '@drift/shared';
import type AnalyticsLogRepository from '../../../domain/analytics-log/repository/analytics-log.repository';
import type { RecordAnalyticsEventInputDto } from './record-analytics-event.dto';
import { EventTypeEnum } from '../../../domain/analytics-log/value-object/event-type.value-object';
import EventType from '../../../domain/analytics-log/value-object/event-type.value-object';
import AnalyticsLog from '../../../domain/analytics-log/entity/analytics-log.entity';
import AnalyticsLogId from '../../../domain/analytics-log/value-object/analytics-log-id.value-object';
import { uuidv7 } from 'uuidv7';
import AnalyticsEventRecordedEvent from '../../../domain/analytics-log/event/analytics-event-recorded.event';
import type DeletedPostRepository from '../../../domain/analytics-log/repository/deleted-post.repository';
import type PostOwnerRepository from '../../../domain/analytics-log/repository/post-owner.repository';
import type PostLastUpdatedRepository from '../../../domain/analytics-log/repository/post-last-updated.repository';
import type EngagementStateRepository from '../../../domain/analytics-log/repository/engagement-state.repository';
import EngagementState from '../../../domain/analytics-log/entity/engagement-state.entity';
import Signal, { SignalEnum } from '../../../domain/analytics-log/value-object/signal.value-object';

export default class RecordAnalyticsEventUseCase implements UseCase<
  RecordAnalyticsEventInputDto,
  void
> {
  constructor(
    private readonly analyticsLogRepository: AnalyticsLogRepository,
    private readonly deletedPostRepository: DeletedPostRepository,
    private readonly postOwnerRepository: PostOwnerRepository,
    private readonly postLastUpdatedRepository: PostLastUpdatedRepository,
    private readonly engagementStateRepository: EngagementStateRepository,
    private readonly eventDispatcher: EventDispatcher,
    private readonly logger: Logger,
  ) {}

  async execute(input: RecordAnalyticsEventInputDto): Promise<void> {
    const analyticsLogId = new AnalyticsLogId(uuidv7());
    const eventType = new EventType(input.eventType);
    const postId = input.postId ? new PostId(input.postId) : null;
    const clientId = new ClientId(input.clientId);
    const timestamp = new Date(input.timestamp);

    const analyticsLog = AnalyticsLog.create({
      id: analyticsLogId,
      clientId,
      eventType,
      postId,
      timestamp,
    });

    await this.analyticsLogRepository.save(analyticsLog);

    if (eventType.equals(new EventType(EventTypeEnum.PostDeleted))) {
      await this.deletedPostRepository.save(postId as PostId, timestamp);
    }

    if (eventType.equals(new EventType(EventTypeEnum.PostCreated)) && postId) {
      await this.postOwnerRepository.save(postId, clientId);
    }

    if (eventType.equals(new EventType(EventTypeEnum.PostUpdated)) && postId) {
      await this.postLastUpdatedRepository.save(postId, timestamp);
      await this.engagementStateRepository.save(
        EngagementState.create({ postId, lastSignal: new Signal(SignalEnum.dropped) }),
      );
    }

    this.logger.info('Analytics event recorded', {
      eventType: input.eventType,
      postId: input.postId,
      clientId: input.clientId,
    });

    const event = new AnalyticsEventRecordedEvent({
      clientId: clientId.toString(),
      eventType: eventType.toString(),
      postId: postId ? postId.toString() : null,
      timestamp: timestamp.toISOString(),
    });

    await this.eventDispatcher.dispatch(event);
  }
}
