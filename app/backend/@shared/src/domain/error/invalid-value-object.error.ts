export default class InvalidValueObjectError extends Error {
  constructor(name: string, reason: string) {
    super(`Invalid ${name}: ${reason}`);
  }
}
