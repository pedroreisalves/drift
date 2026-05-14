export default class DocumentNotFoundError extends Error {
  constructor(public readonly postId: string) {
    super(`Document not found: ${postId}`);
    this.name = 'DocumentNotFoundError';
  }
}
