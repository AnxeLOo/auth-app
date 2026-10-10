import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../errors/app-error';

export interface JwtPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (!decoded.userId || !decoded.sessionId) {
      throw new UnauthorizedError('Token JWT com estrutura inválida');
    }
    return decoded;
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token de acesso expirado');
    }
    throw new UnauthorizedError('Token de acesso inválido');
  }
}
