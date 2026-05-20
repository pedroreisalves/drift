export default class TaggingProcessNotFoundError extends Error {
  constructor(public readonly taggingProcessId: string) {
    super(`Tagging Process not found: ${taggingProcessId}`);
    this.name = 'TaggingProcessNotFoundError';
  }
}
