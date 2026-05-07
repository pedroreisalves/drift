export class InvalidPostError extends Error {
  constructor(public readonly reasons: string[]) {
    super(`Invalid Post: ${reasons.join('; ')}`);
  }
}
