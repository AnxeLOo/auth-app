import Redis from 'ioredis';
import { env } from '../config/env';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
});

let isConnected = false;

redis.on('connect', () => {
  isConnected = true;
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Conectado ao Redis com sucesso');
  }
});

redis.on('error', (err) => {
  isConnected = false;
  if (process.env.NODE_ENV !== 'test') {
    console.error('⚠️ Erro de conexão com o Redis:', err.message);
  }
});

redis.on('close', () => {
  isConnected = false;
});

export async function connectRedis(): Promise<void> {
  if (redis.status === 'wait') {
    try {
      await redis.connect();
    } catch (err: any) {
      console.warn('⚠️ Não foi possível conectar ao Redis na inicialização:', err.message);
    }
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connect') {
      await redis.connect();
    }
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis.status !== 'end') {
    await redis.quit();
  }
}
