import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),

  // H2 Database Config (PostgreSQL wire protocol)
  H2_HOST: z.string().default('localhost'),
  H2_PORT: z.coerce.number().default(5435),
  H2_DATABASE: z.string().default('authdb'),
  H2_USER: z.string().default('sa'),
  H2_PASSWORD: z.string().default(''),

  // Redis Config
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  // JWT & Security
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must have at least 16 characters').default('super_secret_jwt_key_auth_app_dev_test_change_in_production_32chars'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN_SECONDS: z.coerce.number().default(604800), // 7 days

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(20),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Configuração inválida de variáveis de ambiente:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
