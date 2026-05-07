export default class UpdatePostTagsCommand {
  constructor(
    public readonly postId: string,
    public readonly tags: string[],
  ) {}
}
