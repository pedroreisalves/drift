import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
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

export default class Environment {
  static readonly NODE_ENV = parsed.data.NODE_ENV;
  static readonly PORT = parsed.data.PORT;
  static readonly DB_URL = parsed.data.DB_URL;
  static readonly RABBITMQ_EXCHANGE = parsed.data.RABBITMQ_EXCHANGE;
  static readonly RABBITMQ_URL = parsed.data.RABBITMQ_URL;
}
