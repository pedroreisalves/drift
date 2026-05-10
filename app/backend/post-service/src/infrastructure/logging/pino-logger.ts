import pino from 'pino';
import type Logger from '../../application/@shared/interface/logger.interface';
import Environment from '../config/environment';

export default class PinoLogger implements Logger {
  private readonly logger: pino.Logger;

  constructor(serviceName: string) {
    this.logger = pino({
      name: serviceName,
      level: Environment.LOG_LEVEL,
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
