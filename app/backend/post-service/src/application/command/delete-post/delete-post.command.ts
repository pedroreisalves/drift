export default class DeletePostCommand {
  constructor(
    public readonly postId: string,
    public readonly clientId: string,
  ) {}
}
