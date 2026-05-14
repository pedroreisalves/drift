export default class TaggingInProgressError extends Error {
  constructor(postId: string) {
    super(`Post '${postId}' cannot be updated while tagging is in progress`);
    this.name = "TaggingInProgressError";
  }
}
