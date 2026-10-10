import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { routes } from './routes';
import { healthRouter } from './routes/health.routes';
import { errorHandler } from './middlewares/error.middleware';
import { NotFoundError } from './errors/app-error';

export function createApp(): Express {
  const app = express();

  // Cabeçalhos de segurança HTTP
  app.use(helmet());

  // Configuração segura de CORS
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // Parser JSON com limite de tamanho para evitar ataques de DoS por payload excessivo
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Endpoint de health check direto na raiz para balanceadores e orquestradores
  app.use('/health', healthRouter);

  // Rotas da API sob o prefixo /api
  app.use('/api', routes);

  // Handler para rotas inexistentes (404)
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError('Rota não encontrada'));
  });

  // Tratamento centralizado de erros
  app.use(errorHandler);

  return app;
}

export const app = createApp();
