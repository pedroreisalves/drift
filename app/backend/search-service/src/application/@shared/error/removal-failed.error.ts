export default class RemovalFailedError extends Error {
  constructor(reason: string) {
    super(`Removal failed: ${reason}`);
    this.name = 'RemovalFailedError';
  }
}
