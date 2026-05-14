export default class IndexPostTagsCommand {
  constructor(
    public readonly postId: string,
    public readonly tags: string[],
  ) {}
}
