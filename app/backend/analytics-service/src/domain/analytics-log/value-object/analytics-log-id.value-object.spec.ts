import { InvalidValueObjectError } from '@drift/shared';
import { uuidv7 } from 'uuidv7';

import AnalyticsLogId from './analytics-log-id.value-object';

describe('AnalyticsLogId', () => {
  it('should create an AnalyticsLogId with a valid uuidv7', () => {
    const id = uuidv7();

    const analyticsLogId = new AnalyticsLogId(id);

    expect(analyticsLogId).toBeInstanceOf(AnalyticsLogId);
    expect(analyticsLogId.toString()).toEqual(id);
  });

  it('should throw when value is not a valid uuid', () => {
    const invalidId = 'invalid-id';

    expect(() => new AnalyticsLogId(invalidId)).toThrow(InvalidValueObjectError);
    expect(() => new AnalyticsLogId(invalidId)).toThrow(`Invalid AnalyticsLogId: ${invalidId}`);
  });

  it('should throw when value is an empty string', () => {
    expect(() => new AnalyticsLogId('')).toThrow(InvalidValueObjectError);
    expect(() => new AnalyticsLogId('')).toThrow('Invalid AnalyticsLogId: ');
  });

  it('should throw when value is a uuidv4 instead of uuidv7', () => {
    const uuidv4Value = '550e8400-e29b-41d4-a716-446655440000';

    expect(() => new AnalyticsLogId(uuidv4Value)).toThrow(InvalidValueObjectError);
    expect(() => new AnalyticsLogId(uuidv4Value)).toThrow(`Invalid AnalyticsLogId: ${uuidv4Value}`);
  });

  it('should return true when comparing equal analytics log ids', () => {
    const id = uuidv7();
    const analyticsLogId1 = new AnalyticsLogId(id);
    const analyticsLogId2 = new AnalyticsLogId(id);

    expect(analyticsLogId1.equals(analyticsLogId2)).toBe(true);
  });

  it('should return false when comparing different analytics log ids', () => {
    const analyticsLogId1 = new AnalyticsLogId(uuidv7());
    const analyticsLogId2 = new AnalyticsLogId(uuidv7());

    expect(analyticsLogId1.equals(analyticsLogId2)).toBe(false);
  });
});
