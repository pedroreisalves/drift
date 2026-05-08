export default class PostNotFoundError extends Error {
  constructor(public readonly postId: string) {
    super(`Post not found: ${postId}`);
  }
}
