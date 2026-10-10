import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../database/connection';
import { checkRedisHealth } from '../lib/redis';

export class HealthController {
  check = async (_req: Request, res: Response): Promise<void> => {
    const dbHealthy = await checkDatabaseHealth();
    const redisHealthy = await checkRedisHealth();

    const isHealthy = dbHealthy && redisHealthy;
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
    });
  };
}
