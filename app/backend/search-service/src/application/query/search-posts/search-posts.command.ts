export default class SearchPostsQuery {
  constructor(
    public readonly q: string,
    public readonly clientId: string,
    public readonly limit?: number,
    public readonly offset?: number,
  ) {}
}
