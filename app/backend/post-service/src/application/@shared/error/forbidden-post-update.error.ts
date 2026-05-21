export class ForbiddenPostOperationError extends Error {
  constructor(
    public readonly clientId: string,
    public readonly postId: string,
    operation: 'update' | 'delete',
  ) {
    super(`Client ${clientId} is not allowed to ${operation} post ${postId}`);
    this.name = 'ForbiddenPostOperationError';
  }
}
