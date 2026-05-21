import cron from 'node-cron';
import type Scheduler from '../../application/interface/scheduler.interface';
import type { SchedulerOptions } from '../../application/interface/scheduler.interface';

export default class NodeCronScheduler implements Scheduler {
  schedule(
    cronExpression: string,
    handler: () => void | Promise<void>,
    options: SchedulerOptions = {},
  ): void {
    const task = cron.schedule(cronExpression, () => {
      void handler();
    });

    if (options.runAtStartup) {
      void task.execute();
    }

    task.on('execution:missed', async () => {
      await task.execute();
    });
  }
}
