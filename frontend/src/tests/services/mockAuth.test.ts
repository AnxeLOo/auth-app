import { mockAuthService, shouldFallbackToMock, isMockSession } from '../../services/mockAuth';
import { AxiosError } from 'axios';

describe('MockAuth Service & Fallback Utilities Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('shouldFallbackToMock retorna true para 405, 404 e erros de rede', () => {
    const error405 = new AxiosError('Method Not Allowed', '405', undefined, undefined, {
      status: 405,
      statusText: 'Method Not Allowed',
      data: {},
      headers: {},
      config: {} as any,
    });
    expect(shouldFallbackToMock(error405)).toBe(true);

    const error404 = new AxiosError('Not Found', '404', undefined, undefined, {
      status: 404,
      statusText: 'Not Found',
      data: {},
      headers: {},
      config: {} as any,
    });
    expect(shouldFallbackToMock(error404)).toBe(true);

    const networkError = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(shouldFallbackToMock(networkError)).toBe(true);

    // Erros reais de negócio (ex: 400 Bad Request, 401 Unauthorized) não devem ativar fallback
    const error401 = new AxiosError('Unauthorized', '401', undefined, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      data: {},
      headers: {},
      config: {} as any,
    });
    expect(shouldFallbackToMock(error401)).toBe(false);
  });

  test('isMockSession identifica corretamente sessões simuladas', () => {
    expect(isMockSession('mock_sess_12345')).toBe(true);
    expect(isMockSession('sess_redis_real_987')).toBe(false);
    expect(isMockSession(null)).toBe(false);
  });

  test('mockAuthService realiza login com credenciais de seed padrão', () => {
    const res = mockAuthService.login({
      email: 'user@example.com',
      password: 'Password123!',
    });

    expect(res.user.email).toBe('user@example.com');
    expect(res.user.name).toBe('Usuário Demonstração');
    expect(isMockSession(res.sessionId)).toBe(true);
    expect(res.accessToken).toBeDefined();
  });

  test('mockAuthService rejeita senha incorreta para o seed padrão', () => {
    expect(() => {
      mockAuthService.login({
        email: 'user@example.com',
        password: 'SenhaErrada!',
      });
    }).toThrow('Credenciais inválidas informadas');
  });

  test('mockAuthService realiza cadastro simulado e login subsequente', () => {
    const regRes = mockAuthService.register({
      name: 'Maria Silva',
      email: 'maria@empresa.com',
      password: 'Password123!',
    });

    expect(regRes.user.name).toBe('Maria Silva');
    expect(regRes.user.email).toBe('maria@empresa.com');

    // Tentativa de cadastrar o mesmo e-mail deve falhar
    expect(() => {
      mockAuthService.register({
        name: 'Outra Maria',
        email: 'maria@empresa.com',
        password: 'Password123!',
      });
    }).toThrow('O e-mail informado já está em uso');

    // Login com o usuário cadastrado
    const loginRes = mockAuthService.login({
      email: 'maria@empresa.com',
      password: 'Password123!',
    });
    expect(loginRes.user.name).toBe('Maria Silva');
  });
});
