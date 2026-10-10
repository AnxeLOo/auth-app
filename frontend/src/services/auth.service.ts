import { api } from './api';
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

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const response = await api.post<ApiResponse<AuthResponseData>>('/auth/register', payload);
    if (!response.data.data) {
      throw new Error('Resposta de cadastro inválida do servidor');
    }
    return response.data.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const response = await api.post<ApiResponse<AuthResponseData>>('/auth/login', payload);
    if (!response.data.data) {
      throw new Error('Resposta de login inválida do servidor');
    }
    return response.data.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    if (!response.data.data?.user) {
      throw new Error('Falha ao obter dados do usuário autenticado');
    }
    return response.data.data.user;
  },

  async refreshToken(payload: RefreshPayload): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', payload);
    if (!response.data.data) {
      throw new Error('Falha na renovação da sessão');
    }
    return response.data.data;
  },

  async logout(payload?: LogoutPayload): Promise<void> {
    try {
      await api.post<ApiResponse<void>>('/auth/logout', payload || {});
    } catch (error) {
      // Mesmo se a chamada falhar (ex: rede fora), a limpeza local deve prosseguir
      console.warn('Erro ao chamar endpoint de logout no backend:', error);
    }
  },
};
