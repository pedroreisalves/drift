export default class ListPostQuery {
  constructor(
    public readonly limit?: number,
    public readonly offset?: number,
  ) {}
}
