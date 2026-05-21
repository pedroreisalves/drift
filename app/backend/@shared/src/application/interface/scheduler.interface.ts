export interface SchedulerOptions {
  runAtStartup?: boolean;
}

export default interface Scheduler {
  schedule(
    cronExpression: string,
    handler: () => void | Promise<void>,
    options: SchedulerOptions,
  ): void;
}
