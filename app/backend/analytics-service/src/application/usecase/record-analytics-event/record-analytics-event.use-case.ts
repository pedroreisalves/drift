import { ClientId, PostId, type EventDispatcher, type Logger } from '@drift/shared';
import type AnalyticsLogRepository from '../../../domain/analytics-log/repository/analytics-log.repository';
import type { RecordAnalyticsEventInputDto } from './record-analytics-event.input-dto';
import { EventTypeEnum } from '../../../domain/analytics-log/value-object/event-type.value-object';
import EventType from '../../../domain/analytics-log/value-object/event-type.value-object';
import AnalyticsLog from '../../../domain/analytics-log/entity/analytics-log.entity';
import AnalyticsLogId from '../../../domain/analytics-log/value-object/analytics-log-id.value-object';
import { uuidv7 } from 'uuidv7';
import AnalyticsEventRecordedEvent from '../../../domain/analytics-log/event/analytics-event-recorded.event';
import type DeletedPostRepository from '../../../domain/analytics-log/repository/deleted-post.repository';

export default class RecordAnalyticsEventUseCase {
  constructor(
    private readonly analyticsLogRepository: AnalyticsLogRepository,
    private readonly deletedPostRepository: DeletedPostRepository,
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

    this.logger.info('Recording analytics event', {
      eventType: input.eventType,
      postId: input.postId,
      clientId: input.clientId,
    });

    await this.analyticsLogRepository.save(analyticsLog);

    if (eventType.toString() === EventTypeEnum.PostDeleted) {
      await this.deletedPostRepository.save(postId!, timestamp);
    }

    const event = new AnalyticsEventRecordedEvent({
      clientId: clientId.toString(),
      eventType: eventType.toString(),
      postId: postId ? postId.toString() : null,
      timestamp: timestamp.toISOString(),
    });

    await this.eventDispatcher.dispatch(event);
  }
}
