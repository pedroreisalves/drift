import { uuidv7 } from 'uuidv7';
import { PostId, ClientId } from '@drift/shared';
import AnalyticsLog, { type CreateAnalyticsLogProps } from './analytics-log.entity';
import InvalidAnalyticsLogError from '../error/invalid-analytics-log.error';
import AnalyticsLogId from '../value-object/analytics-log-id.value-object';
import EventType, { EventTypeEnum } from '../value-object/event-type.value-object';

describe('AnalyticsLogEntity', () => {
  const makeProps = (
    overrides: Partial<CreateAnalyticsLogProps> = {},
  ): CreateAnalyticsLogProps => ({
    id: new AnalyticsLogId(uuidv7()),
    eventType: new EventType(EventTypeEnum.PostViewed),
    postId: new PostId(uuidv7()),
    clientId: new ClientId(uuidv7()),
    timestamp: new Date(),
    ...overrides,
  });

  it('should create an analytics log entity', () => {
    const props = makeProps();

    const analyticsLog = AnalyticsLog.create(props);

    expect(analyticsLog).toBeInstanceOf(AnalyticsLog);
    expect(analyticsLog.id).toEqual(props.id);
    expect(analyticsLog.eventType).toEqual(props.eventType);
    expect(analyticsLog.clientId).toEqual(props.clientId);
    expect(analyticsLog.postId).toEqual(props.postId);
    expect(analyticsLog.timestamp).toEqual(props.timestamp);
  });

  it('should throw an error when creating an analytics log entity with invalid timestamp', () => {
    const props = makeProps({ timestamp: 'invalid' as unknown as Date });

    expect(() => AnalyticsLog.create(props)).toThrow(InvalidAnalyticsLogError);
    expect(() => AnalyticsLog.create(props)).toThrow(/Timestamp must be a valid date/);
  });

  it('should reconstruct an analytics log entity from existing properties', () => {
    const timestamp = new Date('2026-01-01T00:00:00.000Z');
    const props = {
      id: new AnalyticsLogId(uuidv7()),
      eventType: new EventType(EventTypeEnum.PostCreated),
      postId: new PostId(uuidv7()),
      clientId: new ClientId(uuidv7()),
      timestamp,
    };

    const analyticsLog = AnalyticsLog.reconstruct(props);

    expect(analyticsLog).toBeInstanceOf(AnalyticsLog);
    expect(analyticsLog.id).toEqual(props.id);
    expect(analyticsLog.eventType).toEqual(props.eventType);
    expect(analyticsLog.clientId).toEqual(props.clientId);
    expect(analyticsLog.postId).toEqual(props.postId);
    expect(analyticsLog.timestamp).toEqual(timestamp);
  });

  it('should create analytics log with different event types', () => {
    const eventTypes = Object.values(EventTypeEnum);

    eventTypes.forEach((eventType) => {
      const props = makeProps({ eventType: new EventType(eventType) });
      const analyticsLog = AnalyticsLog.create(props);

      expect(analyticsLog.eventType.toString()).toEqual(eventType);
    });
  });

  it('should create an analytics log with null postId', () => {
    const props = makeProps({ postId: null });

    const analyticsLog = AnalyticsLog.create(props);

    expect(analyticsLog.postId).toBeNull();
  });

  it('should reconstruct an analytics log entity with null postId', () => {
    const props = {
      id: new AnalyticsLogId(uuidv7()),
      eventType: new EventType(EventTypeEnum.PostSearched),
      postId: null,
      clientId: new ClientId(uuidv7()),
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    };

    const analyticsLog = AnalyticsLog.reconstruct(props);

    expect(analyticsLog).toBeInstanceOf(AnalyticsLog);
    expect(analyticsLog.postId).toBeNull();
  });
});
