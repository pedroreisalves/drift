import { uuidv7 } from 'uuidv7';
import { InvalidValueObjectError } from '@drift/shared';
import AnalyticsLogId from './analytics-log-id.value-object';

describe('AnalyticsLogId', () => {
  it('should create an analytics log id value object with valid uuid', () => {
    const id = uuidv7();

    const analyticsLogId = new AnalyticsLogId(id);

    expect(analyticsLogId.toString()).toEqual(id);
  });

  it('should throw an error when creating an analytics log id with invalid format', () => {
    const invalidId = 'invalid-id';

    expect(() => new AnalyticsLogId(invalidId)).toThrow(InvalidValueObjectError);
    expect(() => new AnalyticsLogId(invalidId)).toThrow(/Invalid AnalyticsLogId/);
  });

  it('should throw an error when creating an analytics log id with empty string', () => {
    expect(() => new AnalyticsLogId('')).toThrow(InvalidValueObjectError);
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

  it('should validate on construction', () => {
    const invalidId = 'not-a-uuid';

    expect(() => new AnalyticsLogId(invalidId)).toThrow();
  });
});
