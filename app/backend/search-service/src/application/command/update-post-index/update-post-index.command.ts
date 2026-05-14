export default class UpdatePostIndexCommand {
  constructor(
    public readonly postId: string,
    public readonly title: string,
    public readonly body: string,
  ) {}
}
