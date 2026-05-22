import 'dotenv/config';
import pino from 'pino';
import { z } from 'zod';

const envSchema = z.object({
  SERVICE_NAME: z.string().min(1).default('search-service'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PORT: z.coerce.number().int().positive().default(3000),
  RABBITMQ_EXCHANGE: z.string().min(1).default('drift.events'),
  RABBITMQ_URL: z.string().min(1),
  MEILISEARCH_URL: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  pino().error({ errors: parsed.error.issues }, 'Invalid environment variables');
  process.exit(1);
}

const env = parsed.data;

export default class Environment {
  static readonly SERVICE_NAME = env.SERVICE_NAME;
  static readonly NODE_ENV = env.NODE_ENV;
  static readonly LOG_LEVEL = env.LOG_LEVEL;
  static readonly PORT = env.PORT;
  static readonly RABBITMQ_EXCHANGE = env.RABBITMQ_EXCHANGE;
  static readonly RABBITMQ_URL = env.RABBITMQ_URL;
  static readonly MEILISEARCH_URL = env.MEILISEARCH_URL;
}
