export default class InvalidPostTagsError extends Error {
  constructor(public readonly reasons: string[]) {
    super(`Invalid Post Tags: ${reasons.join('; ')}`);
    this.name = "InvalidPostTagsError";
  }
}
