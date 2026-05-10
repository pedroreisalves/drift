import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  SERVICE_NAME: z.string().min(1).default('post-service'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PORT: z.coerce.number().int().positive().default(3001),
  DB_URL: z.url(),
  RABBITMQ_EXCHANGE: z.string().min(1).default('drift.events'),
  RABBITMQ_URL: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

export default class Environment {
  static readonly SERVICE_NAME = env.SERVICE_NAME;
  static readonly NODE_ENV = env.NODE_ENV;
  static readonly LOG_LEVEL = env.LOG_LEVEL;
  static readonly PORT = env.PORT;
  static readonly DB_URL = env.DB_URL;
  static readonly RABBITMQ_EXCHANGE = env.RABBITMQ_EXCHANGE;
  static readonly RABBITMQ_URL = env.RABBITMQ_URL;
}
