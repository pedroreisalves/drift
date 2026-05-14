export default class InvalidSearchEntryError extends Error {
  constructor(public readonly reasons: string[]) {
    super(`Invalid Search Entry: ${reasons.join('; ')}`);
    this.name = 'InvalidSearchEntryError';
  }
}
