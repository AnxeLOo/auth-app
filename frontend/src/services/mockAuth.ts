import { AxiosError } from 'axios';
import {
  AuthResponseData,
  LoginPayload,
  RegisterPayload,
  User,
  AuthTokens,
} from '../types/auth.types';

const MOCK_STORAGE_USERS_KEY = 'mock_auth_registered_users';
const MOCK_CURRENT_USER_KEY = 'mock_auth_current_user';

export const isMockSession = (sessionId?: string | null): boolean => {
  return !!sessionId && sessionId.startsWith('mock_sess_');
};

export const shouldFallbackToMock = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    // 405: Vercel rewrite em arquivos estáticos (SPA sem backend)
    // 404: Endpoint /api não existe
    // ERR_NETWORK / sem response: Backend offline
    if (
      axiosError.response?.status === 405 ||
      axiosError.response?.status === 404 ||
      axiosError.code === 'ERR_NETWORK' ||
      !axiosError.response
    ) {
      return true;
    }
  }
  return false;
};

const getRegisteredUsers = (): Record<string, { user: User; passwordHash: string }> => {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveRegisteredUsers = (users: Record<string, { user: User; passwordHash: string }>) => {
  try {
    localStorage.setItem(MOCK_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage errors
  }
};

export const mockAuthService = {
  login(payload: LoginPayload): AuthResponseData {
    const email = payload.email.trim().toLowerCase();
    const registeredUsers = getRegisteredUsers();

    // 1. Usuário padrão do seed de demonstração
    if (email === 'user@example.com') {
      if (payload.password !== 'Password123!') {
        throw new Error('Credenciais inválidas informadas');
      }
      const user: User = {
        id: 'usr_demo_seed_01',
        name: 'Usuário Demonstração',
        email: 'user@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      try {
        sessionStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
      } catch {}
      return {
        user,
        accessToken: 'mock_jwt_access_token_demo',
        refreshToken: 'mock_jwt_refresh_token_demo',
        expiresIn: '15m',
        sessionId: 'mock_sess_' + Date.now(),
      };
    }

    // 2. Usuário previamente cadastrado na sessão mock
    if (registeredUsers[email]) {
      if (registeredUsers[email].passwordHash !== payload.password) {
        throw new Error('Credenciais inválidas informadas');
      }
      const user = registeredUsers[email].user;
      try {
        sessionStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
      } catch {}
      return {
        user,
        accessToken: 'mock_jwt_access_token_demo',
        refreshToken: 'mock_jwt_refresh_token_demo',
        expiresIn: '15m',
        sessionId: 'mock_sess_' + Date.now(),
      };
    }

    // 3. Fallback permissivo para qualquer usuário informado no modo demonstração
    const guestUser: User = {
      id: 'usr_mock_' + Math.random().toString(36).substring(2, 9),
      name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: payload.email,
      createdAt: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(guestUser));
    } catch {}
    return {
      user: guestUser,
      accessToken: 'mock_jwt_access_token_demo',
      refreshToken: 'mock_jwt_refresh_token_demo',
      expiresIn: '15m',
      sessionId: 'mock_sess_' + Date.now(),
    };
  },

  register(payload: RegisterPayload): AuthResponseData {
    const email = payload.email.trim().toLowerCase();
    const registeredUsers = getRegisteredUsers();

    if (email === 'user@example.com' || registeredUsers[email]) {
      throw new Error('O e-mail informado já está em uso');
    }

    const newUser: User = {
      id: 'usr_mock_' + Math.random().toString(36).substring(2, 9),
      name: payload.name.trim(),
      email: payload.email.trim(),
      createdAt: new Date().toISOString(),
    };

    registeredUsers[email] = {
      user: newUser,
      passwordHash: payload.password,
    };
    saveRegisteredUsers(registeredUsers);

    try {
      sessionStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(newUser));
    } catch {}

    return {
      user: newUser,
      accessToken: 'mock_jwt_access_token_demo',
      refreshToken: 'mock_jwt_refresh_token_demo',
      expiresIn: '15m',
      sessionId: 'mock_sess_' + Date.now(),
    };
  },

  getCurrentUser(): User {
    try {
      const raw = sessionStorage.getItem(MOCK_CURRENT_USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      id: 'usr_demo_seed_01',
      name: 'Usuário Demonstração',
      email: 'user@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
  },

  refreshToken(): AuthTokens {
    return {
      accessToken: 'mock_access_token_refreshed_' + Date.now(),
      refreshToken: 'mock_refresh_token_refreshed_' + Date.now(),
      expiresIn: '15m',
      sessionId: 'mock_sess_' + Date.now(),
    };
  },

  logout(): void {
    try {
      sessionStorage.removeItem(MOCK_CURRENT_USER_KEY);
    } catch {}
  },
};
