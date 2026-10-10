import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { RefreshPayload, ApiResponse, AuthTokens } from '../types/auth.types';

// Fallback seguro de baseURL para Vite e Jest
const getBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL;
  }
  return '/api';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Armazenamento em memória do Access Token para mitigar XSS persistente
let inMemoryAccessToken: string | null = null;
let onAuthExpiredCallback: (() => void) | null = null;

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const registerAuthExpiredHandler = (callback: () => void): void => {
  onAuthExpiredCallback = callback;
};

// Armazenamento de sessão de renovação em sessionStorage (descartado ao fechar aba)
const SESSION_STORAGE_KEY = 'auth_session_data';

export const saveSessionStorage = (data: { sessionId: string; refreshToken: string }): void => {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
};

export const getSessionStorage = (): { sessionId: string; refreshToken: string } | null => {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearSessionStorage = (): void => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  inMemoryAccessToken = null;
};

// Interceptor de requisições: injeta Bearer token se presente
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag para evitar loops infinitos de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de respostas: lida com 401 e renovação de token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Se for 401 e não for rota de login/refresh/register e ainda não tentou retry
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/register')
    ) {
      const session = getSessionStorage();
      if (!session) {
        clearSessionStorage();
        if (onAuthExpiredCallback) onAuthExpiredCallback();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const payload: RefreshPayload = {
          sessionId: session.sessionId,
          refreshToken: session.refreshToken,
        };

        const res = await axios.post<ApiResponse<AuthTokens>>(
          `${api.defaults.baseURL}/auth/refresh`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (res.data.data) {
          const { accessToken, refreshToken, sessionId } = res.data.data;
          setAccessToken(accessToken);
          saveSessionStorage({ sessionId, refreshToken });

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          processQueue(null, accessToken);
          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearSessionStorage();
        if (onAuthExpiredCallback) onAuthExpiredCallback();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Utilitário para extrair mensagem amigável de erro da API
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    if (axiosError.response?.data?.error?.message) {
      return axiosError.response.data.error.message;
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.status === 401) {
      return 'Sessão expirada ou credenciais inválidas.';
    }
    if (axiosError.response?.status === 404) {
      return 'Recurso não encontrado.';
    }
    if (axiosError.response?.status === 429) {
      return 'Muitas tentativas. Por favor, aguarde alguns minutos.';
    }
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Não foi possível conectar ao servidor. Verifique se a API está online.';
    }
    return axiosError.message || 'Erro inesperado na comunicação com a API.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro desconhecido.';
};
