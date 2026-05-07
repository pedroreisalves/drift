export default class CreatePostCommand {
  constructor(
    public readonly clientId: string,
    public readonly clientName: string,
    public readonly title: string,
    public readonly body: string,
  ) {}
}
