import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../security/jwt';
import { UnauthorizedError } from '../errors/app-error';
import { ISessionService, RedisSessionService } from '../services/session.service';

export function createAuthMiddleware(sessionService?: ISessionService) {
  const sessions = sessionService || new RedisSessionService();

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedError('Token de autenticação não fornecido');
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedError('Formato do token inválido. Esperado: Bearer <token>');
      }

      const token = parts[1];
      const payload = verifyAccessToken(token);

      // Valida se a sessão no Redis ainda existe (não foi feito logout)
      const session = await sessions.validateSession(payload.sessionId);
      if (!session) {
        throw new UnauthorizedError('Sessão expirada ou encerrada');
      }

      req.user = {
        id: payload.userId,
        email: payload.email,
        sessionId: payload.sessionId,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const requireAuth = createAuthMiddleware();

export function createOptionalAuthMiddleware(sessionService?: ISessionService) {
  const sessions = sessionService || new RedisSessionService();

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return next();
      }

      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        try {
          const payload = verifyAccessToken(token);
          const session = await sessions.validateSession(payload.sessionId);
          if (session) {
            req.user = {
              id: payload.userId,
              email: payload.email,
              sessionId: payload.sessionId,
            };
          }
        } catch {
          // Token inválido ignorado no middleware opcional
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const optionalAuth = createOptionalAuthMiddleware();
