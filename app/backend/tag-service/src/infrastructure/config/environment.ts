import 'dotenv/config';
import pino from 'pino';
import { z } from 'zod';

const envSchema = z.object({
  SERVICE_NAME: z.string().min(1).default('tag-service'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DB_URL: z.url(),
  RABBITMQ_EXCHANGE: z.string().min(1).default('drift.events'),
  RABBITMQ_URL: z.string().min(1),
  OLLAMA_URL: z.string().min(1),
  OLLAMA_MODEL: z.string().min(1).default('qwen2.5:1.5b'),
  OLLAMA_TIMEOUT_MS: z.coerce.number().min(1).default(60000),
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
  static readonly DB_URL = env.DB_URL;
  static readonly RABBITMQ_EXCHANGE = env.RABBITMQ_EXCHANGE;
  static readonly RABBITMQ_URL = env.RABBITMQ_URL;
  static readonly OLLAMA_URL = env.OLLAMA_URL;
  static readonly OLLAMA_MODEL = env.OLLAMA_MODEL;
  static readonly OLLAMA_TIMEOUT_MS = env.OLLAMA_TIMEOUT_MS;
}
