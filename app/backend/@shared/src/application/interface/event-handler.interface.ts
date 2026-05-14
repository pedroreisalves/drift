export default interface EventHandler<T = unknown> {
  handle(event: T): Promise<void>;
}
