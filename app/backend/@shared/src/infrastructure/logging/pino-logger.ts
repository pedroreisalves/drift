import pino from 'pino';

import type Logger from '../../application/interface/logger.interface';

export default class PinoLogger implements Logger {
  private readonly logger: pino.Logger;

  constructor(serviceName: string, logLevel: string) {
    this.logger = pino({
      name: serviceName,
      level: logLevel,
    });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(context, message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(context, message);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(context, message);
  }
}
