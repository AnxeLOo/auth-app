import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import * as apiModule from '../../services/api';

jest.mock('../../services/auth.service');

describe('useAuth Hook Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    apiModule.clearSessionStorage();
  });

  test('lança erro quando invocado fora do AuthProvider', () => {
    // Silencia console.error do React para este teste esperado
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth deve ser utilizado dentro de um AuthProvider');

    consoleSpy.mockRestore();
  });

  test('inicializa com estado desautenticado quando não há dados em sessionStorage', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  test('executa o login com sucesso e atualiza o estado e sessão', async () => {
    const mockAuthResponse = {
      user: {
        id: 'usr-1',
        name: 'Maria Santos',
        email: 'maria@exemplo.com',
        createdAt: '2026-10-10T12:00:00Z',
      },
      accessToken: 'jwt-access-token',
      refreshToken: 'refresh-token-xyz',
      sessionId: 'sess-123',
      expiresIn: '15m',
    };

    (authService.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login({
        email: 'maria@exemplo.com',
        password: 'Password123!',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockAuthResponse.user);
    expect(result.current.token).toBe('jwt-access-token');
    expect(result.current.sessionId).toBe('sess-123');

    // Verifica persistência na sessão
    const stored = apiModule.getSessionStorage();
    expect(stored).toEqual({
      sessionId: 'sess-123',
      refreshToken: 'refresh-token-xyz',
    });
  });

  test('executa o logout limpando o estado autenticado e chamando a API', async () => {
    const mockAuthResponse = {
      user: {
        id: 'usr-1',
        name: 'Maria Santos',
        email: 'maria@exemplo.com',
        createdAt: '2026-10-10T12:00:00Z',
      },
      accessToken: 'jwt-access-token',
      refreshToken: 'refresh-token-xyz',
      sessionId: 'sess-123',
      expiresIn: '15m',
    };

    (authService.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
    (authService.logout as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login({
        email: 'maria@exemplo.com',
        password: 'Password123!',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(authService.logout).toHaveBeenCalledWith({ sessionId: 'sess-123' });
    expect(apiModule.getSessionStorage()).toBeNull();
  });

  test('restaura a sessão na inicialização quando há dados prévios no sessionStorage', async () => {
    apiModule.saveSessionStorage({
      sessionId: 'sess-salva',
      refreshToken: 'refresh-salvo',
    });

    (authService.refreshToken as jest.Mock).mockResolvedValueOnce({
      accessToken: 'novo-access-token',
      refreshToken: 'novo-refresh-token',
      sessionId: 'sess-salva',
      expiresIn: '15m',
    });

    (authService.getCurrentUser as jest.Mock).mockResolvedValueOnce({
      id: 'usr-restaurado',
      name: 'Usuário Restaurado',
      email: 'restaurado@exemplo.com',
      createdAt: '2026-10-10T10:00:00Z',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('restaurado@exemplo.com');
    expect(result.current.token).toBe('novo-access-token');
  });
});
