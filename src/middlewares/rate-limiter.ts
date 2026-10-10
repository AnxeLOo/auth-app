import rateLimit, { MemoryStore } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../lib/redis';
import { env } from '../config/env';

export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Muitas tentativas de autenticação. Por favor, tente novamente mais tarde.',
      code: 'TOO_MANY_REQUESTS',
    },
  },
  skip: () => env.NODE_ENV === 'test',
  store:
    env.NODE_ENV === 'test'
      ? new MemoryStore()
      : new RedisStore({
          sendCommand: (...args: string[]) => (redis as any).call(...args),
          prefix: 'rl:auth:',
        }),
});
