import {
  setAccessToken,
  getAccessToken,
  saveSessionStorage,
  getSessionStorage,
  clearSessionStorage,
  getErrorMessage,
} from '../../services/api';
import { AxiosError } from 'axios';

describe('API Service and Utilities Unit Tests', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearSessionStorage();
  });

  test('gerencia access token em memória corretamente', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('token-123');
    expect(getAccessToken()).toBe('token-123');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  test('salva, recupera e limpa credenciais da sessão no sessionStorage', () => {
    expect(getSessionStorage()).toBeNull();

    saveSessionStorage({
      sessionId: 'sess-abc',
      refreshToken: 'refr-xyz',
    });

    expect(getSessionStorage()).toEqual({
      sessionId: 'sess-abc',
      refreshToken: 'refr-xyz',
    });

    clearSessionStorage();
    expect(getSessionStorage()).toBeNull();
  });

  test('retorna mensagens de erro amigáveis para diferentes cenários de erro da API', () => {
    // Erro de rede
    const networkError = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(getErrorMessage(networkError)).toBe(
      'Não foi possível conectar ao servidor. Verifique se a API está online.'
    );

    // Erro 401
    const unauthError = new AxiosError('Unauthorized', '401', undefined, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      data: {},
      headers: {},
      config: {} as any,
    });
    expect(getErrorMessage(unauthError)).toBe('Sessão expirada ou credenciais inválidas.');

    // Erro com payload estruturado da API
    const apiError = new AxiosError('Bad Request', '400', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      data: {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas informadas' },
      },
      headers: {},
      config: {} as any,
    });
    expect(getErrorMessage(apiError)).toBe('Credenciais inválidas informadas');

    // Erro genérico do JavaScript
    expect(getErrorMessage(new Error('Erro personalizado'))).toBe('Erro personalizado');
  });
});
