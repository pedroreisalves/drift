export default class UpdatePostCommand {
  constructor(
    public readonly postId: string,
    public readonly clientId: string,
    public readonly title?: string,
    public readonly body?: string,
  ) {}
}
