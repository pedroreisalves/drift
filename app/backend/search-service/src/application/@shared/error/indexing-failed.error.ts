export default class IndexingFailedError extends Error {
  constructor(reason: string) {
    super(`Indexing failed: ${reason}`);
    this.name = 'IndexingFailedError';
  }
}
