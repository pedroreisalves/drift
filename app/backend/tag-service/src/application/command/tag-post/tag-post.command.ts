export default class TagPostCommand {
  constructor(
    public readonly postId: string,
    public readonly title: string,
    public readonly body: string,
    public readonly postUpdatedAt: string,
  ) {}
}
