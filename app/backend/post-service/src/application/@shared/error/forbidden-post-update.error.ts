export default class ForbiddenPostUpdateError extends Error {
  constructor(public readonly postId: string, public readonly clientId: string) {
    super(`Client ${clientId} is not allowed to update post ${postId}`);
  }
}
