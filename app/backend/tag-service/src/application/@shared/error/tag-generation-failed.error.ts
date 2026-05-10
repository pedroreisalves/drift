export default class TagGenerationFailedError extends Error {
  constructor(reason: string) {
    super(`Tag generation failed: ${reason}`);
  }
}
