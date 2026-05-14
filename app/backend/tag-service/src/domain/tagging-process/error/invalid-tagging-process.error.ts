export default class InvalidTaggingProcessError extends Error {
  constructor(public readonly reasons: string[]) {
    super(`Invalid Tagging Process: ${reasons.join('; ')}`);
    this.name = "InvalidTaggingProcessError";
  }
}
