import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service';
import { InMemoryUserRepository } from '../../src/repositories/in-memory-user.repository';
import { InMemorySessionService } from '../../src/services/session.service';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../src/errors/app-error';

describe('AuthService (Unit)', () => {
  let userRepo: InMemoryUserRepository;
  let sessionService: InMemorySessionService;
  let authService: AuthService;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    sessionService = new InMemorySessionService();
    authService = new AuthService(userRepo, sessionService);
  });

  describe('register', () => {
    it('deve cadastrar um novo usuário com sucesso e retornar credenciais', async () => {
      const result = await authService.register({
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        password: 'Password123!',
      });

      expect(result.user).toBeDefined();
      expect(result.user.name).toBe('Carlos Silva');
      expect(result.user.email).toBe('carlos@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.sessionId).toBeDefined();

      // Verifica se a senha salva no repositório é um hash seguro
      const savedUser = await userRepo.findByEmail('carlos@example.com');
      expect(savedUser).not.toBeNull();
      expect(savedUser?.password_hash).not.toBe('Password123!');
      expect(savedUser?.password_hash).toContain('$argon2id$');
    });

    it('deve impedir o cadastro de e-mails duplicados', async () => {
      await authService.register({
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        password: 'Password123!',
      });

      await expect(
        authService.register({
          name: 'Carlos Outro',
          email: 'carlos@example.com',
          password: 'Password456!',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        name: 'Maria Souza',
        email: 'maria@example.com',
        password: 'Password123!',
      });
    });

    it('deve autenticar usuário com e-mail e senha corretos', async () => {
      const result = await authService.login({
        email: 'maria@example.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('maria@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.sessionId).toBeDefined();
    });

    it('deve rejeitar e-mail inexistente com mensagem genérica', async () => {
      await expect(
        authService.login({
          email: 'naoexiste@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('deve rejeitar senha incorreta', async () => {
      await expect(
        authService.login({
          email: 'maria@example.com',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refresh token & rotação', () => {
    it('deve rotacionar o refresh token e emitir novo access token', async () => {
      const auth = await authService.register({
        name: 'Lucas Teste',
        email: 'lucas@example.com',
        password: 'Password123!',
      });

      const refreshResult = await authService.refresh({
        sessionId: auth.sessionId,
        refreshToken: auth.refreshToken,
      });

      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.refreshToken).not.toBe(auth.refreshToken);
    });

    it('deve detectar tentativa de reuso de token e revogar a sessão', async () => {
      const auth = await authService.register({
        name: 'Lucas Teste',
        email: 'lucas@example.com',
        password: 'Password123!',
      });

      // Primeiro refresh: token original é rotacionado
      await authService.refresh({
        sessionId: auth.sessionId,
        refreshToken: auth.refreshToken,
      });

      // Tentativa de reutilizar o token anterior já consumido
      await expect(
        authService.refresh({
          sessionId: auth.sessionId,
          refreshToken: auth.refreshToken,
        })
      ).rejects.toThrow('Tentativa de reuso de token detectada');

      // Verifica se a sessão foi completamente revogada
      const session = await sessionService.validateSession(auth.sessionId);
      expect(session).toBeNull();
    });
  });

  describe('logout', () => {
    it('deve invalidar a sessão após o logout', async () => {
      const auth = await authService.register({
        name: 'Ana Paula',
        email: 'ana@example.com',
        password: 'Password123!',
      });

      await authService.logout(auth.sessionId);

      const session = await sessionService.validateSession(auth.sessionId);
      expect(session).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('deve retornar os dados do usuário autenticado', async () => {
      const auth = await authService.register({
        name: 'Fernanda Lima',
        email: 'fernanda@example.com',
        password: 'Password123!',
      });

      const user = await authService.getCurrentUser(auth.user.id);
      expect(user.id).toBe(auth.user.id);
      expect(user.email).toBe('fernanda@example.com');
      expect((user as any).password_hash).toBeUndefined();
    });

    it('deve lançar erro se usuário não for encontrado', async () => {
      await expect(authService.getCurrentUser('id-inexistente')).rejects.toThrow(NotFoundError);
    });
  });
});
