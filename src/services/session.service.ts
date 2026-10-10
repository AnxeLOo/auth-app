import crypto from 'crypto';
import { redis } from '../lib/redis';
import { env } from '../config/env';
import { ServiceUnavailableError, UnauthorizedError } from '../errors/app-error';

export interface SessionData {
  sessionId: string;
  userId: string;
  email: string;
  refreshTokenHash: string;
  createdAt: number;
}

export interface ISessionService {
  createSession(userId: string, email: string): Promise<{ sessionId: string; refreshToken: string }>;
  rotateRefreshToken(sessionId: string, currentRefreshToken: string): Promise<{ newRefreshToken: string; session: SessionData }>;
  validateSession(sessionId: string): Promise<SessionData | null>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class RedisSessionService implements ISessionService {
  private sessionKey(sessionId: string): string {
    return `auth:session:${sessionId}`;
  }

  private userSessionsKey(userId: string): string {
    return `auth:user:${userId}:sessions`;
  }

  async createSession(userId: string, email: string): Promise<{ sessionId: string; refreshToken: string }> {
    try {
      const sessionId = crypto.randomUUID();
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const refreshTokenHash = hashToken(refreshToken);

      const sessionData: SessionData = {
        sessionId,
        userId,
        email,
        refreshTokenHash,
        createdAt: Date.now(),
      };

      const key = this.sessionKey(sessionId);
      const userKey = this.userSessionsKey(userId);
      const ttl = env.REFRESH_TOKEN_EXPIRES_IN_SECONDS;

      // Armazena a sessão e associa ao usuário
      await redis
        .pipeline()
        .set(key, JSON.stringify(sessionData), 'EX', ttl)
        .sadd(userKey, sessionId)
        .expire(userKey, ttl)
        .exec();

      return { sessionId, refreshToken };
    } catch (error: any) {
      if (error instanceof UnauthorizedError) throw error;
      console.error('Erro de comunicação com o Redis em createSession:', error.message);
      throw new ServiceUnavailableError('Serviço de sessão indisponível no momento');
    }
  }

  async validateSession(sessionId: string): Promise<SessionData | null> {
    try {
      const data = await redis.get(this.sessionKey(sessionId));
      if (!data) return null;
      return JSON.parse(data) as SessionData;
    } catch (error: any) {
      console.error('Erro de comunicação com o Redis em validateSession:', error.message);
      throw new ServiceUnavailableError('Não foi possível validar a sessão no momento');
    }
  }

  async rotateRefreshToken(
    sessionId: string,
    currentRefreshToken: string
  ): Promise<{ newRefreshToken: string; session: SessionData }> {
    try {
      const key = this.sessionKey(sessionId);
      const data = await redis.get(key);

      if (!data) {
        throw new UnauthorizedError('Sessão expirada ou inválida');
      }

      const session: SessionData = JSON.parse(data);
      const incomingHash = hashToken(currentRefreshToken);

      // Verificação de reuso de token (Token Reuse Detection)
      if (session.refreshTokenHash !== incomingHash) {
        // Possível ataque de replay: revoga todas as sessões do usuário imediatamente
        await this.revokeAllUserSessions(session.userId);
        throw new UnauthorizedError('Tentativa de reuso de token detectada. Todas as sessões foram invalidadas.');
      }

      // Gera novo refresh token (rotação)
      const newRefreshToken = crypto.randomBytes(32).toString('hex');
      session.refreshTokenHash = hashToken(newRefreshToken);

      const ttl = env.REFRESH_TOKEN_EXPIRES_IN_SECONDS;
      await redis.set(key, JSON.stringify(session), 'EX', ttl);

      return { newRefreshToken, session };
    } catch (error: any) {
      if (error instanceof UnauthorizedError || error instanceof ServiceUnavailableError) {
        throw error;
      }
      console.error('Erro de comunicação com o Redis em rotateRefreshToken:', error.message);
      throw new ServiceUnavailableError('Falha ao renovar credenciais no Redis');
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      const key = this.sessionKey(sessionId);
      const data = await redis.get(key);
      if (data) {
        const session: SessionData = JSON.parse(data);
        const userKey = this.userSessionsKey(session.userId);
        await redis
          .pipeline()
          .del(key)
          .srem(userKey, sessionId)
          .exec();
      } else {
        await redis.del(key);
      }
    } catch (error: any) {
      console.error('Erro ao revogar sessão no Redis:', error.message);
      throw new ServiceUnavailableError('Falha ao invalidar sessão no Redis');
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const userKey = this.userSessionsKey(userId);
      const sessionIds = await redis.smembers(userKey);

      if (sessionIds.length > 0) {
        const pipeline = redis.pipeline();
        for (const id of sessionIds) {
          pipeline.del(this.sessionKey(id));
        }
        pipeline.del(userKey);
        await pipeline.exec();
      }
    } catch (error: any) {
      console.error('Erro ao revogar todas as sessões no Redis:', error.message);
      throw new ServiceUnavailableError('Falha ao revogar sessões no Redis');
    }
  }
}

export class InMemorySessionService implements ISessionService {
  private sessions = new Map<string, SessionData>();
  private userSessions = new Map<string, Set<string>>();

  async createSession(userId: string, email: string): Promise<{ sessionId: string; refreshToken: string }> {
    const sessionId = crypto.randomUUID();
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = hashToken(refreshToken);

    const sessionData: SessionData = {
      sessionId,
      userId,
      email,
      refreshTokenHash,
      createdAt: Date.now(),
    };

    this.sessions.set(sessionId, sessionData);
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);

    return { sessionId, refreshToken };
  }

  async validateSession(sessionId: string): Promise<SessionData | null> {
    return this.sessions.get(sessionId) || null;
  }

  async rotateRefreshToken(
    sessionId: string,
    currentRefreshToken: string
  ): Promise<{ newRefreshToken: string; session: SessionData }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedError('Sessão expirada ou inválida');
    }

    const incomingHash = hashToken(currentRefreshToken);
    if (session.refreshTokenHash !== incomingHash) {
      await this.revokeAllUserSessions(session.userId);
      throw new UnauthorizedError('Tentativa de reuso de token detectada. Todas as sessões foram invalidadas.');
    }

    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    session.refreshTokenHash = hashToken(newRefreshToken);
    this.sessions.set(sessionId, session);

    return { newRefreshToken, session };
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      const set = this.userSessions.get(session.userId);
      if (set) {
        set.delete(sessionId);
      }
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const set = this.userSessions.get(userId);
    if (set) {
      for (const sid of set) {
        this.sessions.delete(sid);
      }
      this.userSessions.delete(userId);
    }
  }

  clear(): void {
    this.sessions.clear();
    this.userSessions.clear();
  }
}
