import { api, getSessionStorage } from './api';
import {
  LoginPayload,
  RegisterPayload,
  RefreshPayload,
  LogoutPayload,
  ApiResponse,
  AuthResponseData,
  User,
  AuthTokens,
} from '../types/auth.types';
import { mockAuthService, shouldFallbackToMock, isMockSession } from './mockAuth';

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    try {
      const response = await api.post<ApiResponse<AuthResponseData>>('/auth/register', payload);
      if (!response.data.data) {
        throw new Error('Resposta de cadastro inválida do servidor');
      }
      return response.data.data;
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        return mockAuthService.register(payload);
      }
      throw error;
    }
  },

  async login(payload: LoginPayload): Promise<AuthResponseData> {
    try {
      const response = await api.post<ApiResponse<AuthResponseData>>('/auth/login', payload);
      if (!response.data.data) {
        throw new Error('Resposta de login inválida do servidor');
      }
      return response.data.data;
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        return mockAuthService.login(payload);
      }
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    const session = getSessionStorage();
    if (isMockSession(session?.sessionId)) {
      return mockAuthService.getCurrentUser();
    }

    try {
      const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
      if (!response.data.data?.user) {
        throw new Error('Falha ao obter dados do usuário autenticado');
      }
      return response.data.data.user;
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        return mockAuthService.getCurrentUser();
      }
      throw error;
    }
  },

  async refreshToken(payload: RefreshPayload): Promise<AuthTokens> {
    if (isMockSession(payload.sessionId)) {
      return mockAuthService.refreshToken();
    }

    try {
      const response = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', payload);
      if (!response.data.data) {
        throw new Error('Falha na renovação da sessão');
      }
      return response.data.data;
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        return mockAuthService.refreshToken();
      }
      throw error;
    }
  },

  async logout(payload?: LogoutPayload): Promise<void> {
    if (isMockSession(payload?.sessionId)) {
      mockAuthService.logout();
      return;
    }

    try {
      await api.post<ApiResponse<void>>('/auth/logout', payload || {});
    } catch (error) {
      // Em caso de falha de rede ou backend indisponível, limpa a sessão local
      mockAuthService.logout();
    }
  },
};
