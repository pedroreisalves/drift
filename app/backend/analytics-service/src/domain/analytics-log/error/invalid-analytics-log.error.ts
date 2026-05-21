export default class InvalidAnalyticsLogError extends Error {
  constructor(public readonly reasons: string[]) {
    super(`Invalid Analytics Log: ${reasons.join('; ')}`);
    this.name = 'InvalidAnalyticsLogError';
  }
}
