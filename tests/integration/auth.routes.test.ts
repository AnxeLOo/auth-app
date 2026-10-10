import { describe, it, expect, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createAuthRouter } from '../../src/routes/auth.routes';
import { AuthController } from '../../src/controllers/auth.controller';
import { AuthService } from '../../src/services/auth.service';
import { InMemoryUserRepository } from '../../src/repositories/in-memory-user.repository';
import { InMemorySessionService } from '../../src/services/session.service';
import { createAuthMiddleware, createOptionalAuthMiddleware } from '../../src/middlewares/auth.middleware';
import { errorHandler } from '../../src/middlewares/error.middleware';

function createTestApp(authService: AuthService, sessionService: InMemorySessionService): Express {
  const app = express();
  app.use(express.json());

  const controller = new AuthController(authService);
  const authMiddleware = createAuthMiddleware(sessionService);
  const optionalAuthMiddleware = createOptionalAuthMiddleware(sessionService);
  const router = createAuthRouter(controller, authMiddleware, optionalAuthMiddleware);

  app.use('/api/auth', router);
  app.use(errorHandler);

  return app;
}

describe('Auth Routes (Integration HTTP)', () => {
  let app: Express;
  let userRepo: InMemoryUserRepository;
  let sessionService: InMemorySessionService;
  let authService: AuthService;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    sessionService = new InMemorySessionService();
    authService = new AuthService(userRepo, sessionService);
    app = createTestApp(authService, sessionService);
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar um usuário com sucesso e retornar status 201', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Pedro',
          email: 'joao@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('joao@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.sessionId).toBeDefined();
    });

    it('deve retornar 400 quando a senha não atingir os critérios de segurança', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Pedro',
          email: 'joao@example.com',
          password: 'fraca',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.details).toBeDefined();
    });

    it('deve retornar 409 ao tentar cadastrar o mesmo e-mail duas vezes', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Pedro',
          email: 'joao@example.com',
          password: 'Password123!',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Clone',
          email: 'joao@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Usuario Teste',
          email: 'login@example.com',
          password: 'Password123!',
        });
    });

    it('deve autenticar com sucesso e retornar status 200', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('deve retornar 401 ao enviar senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('deve retornar 401 ao enviar e-mail não cadastrado', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Usuario Protegido',
          email: 'protegido@example.com',
          password: 'Password123!',
        });
      accessToken = reg.body.data.accessToken;
    });

    it('deve permitir acesso à rota protegida com Bearer token válido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('protegido@example.com');
      expect(response.body.data.user.name).toBe('Usuario Protegido');
    });

    it('deve rejeitar requisição sem header Authorization com 401', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('deve rejeitar token malformado ou alterado com 401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalido_alterado');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('deve renovar credenciais com refresh token válido', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Usuario Refresh',
          email: 'refresh@example.com',
          password: 'Password123!',
        });

      const { sessionId, refreshToken } = reg.body.data;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ sessionId, refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('deve invalidar a sessão e impedir novas chamadas protegidas', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Usuario Logout',
          email: 'logout@example.com',
          password: 'Password123!',
        });

      const { accessToken, sessionId } = reg.body.data;

      // Executa o logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ sessionId });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Tenta acessar /me com o mesmo access token da sessão invalidada
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meRes.status).toBe(401);
      expect(meRes.body.error.message).toContain('Sessão expirada ou encerrada');
    });
  });
});
