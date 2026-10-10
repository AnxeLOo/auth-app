import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, LoginPayload, RegisterPayload } from '../types/auth.types';
import { authService } from '../services/auth.service';
import {
  setAccessToken,
  saveSessionStorage,
  getSessionStorage,
  clearSessionStorage,
  registerAuthExpiredHandler,
} from '../services/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleLogout = useCallback(async () => {
    const currentSession = sessionId || getSessionStorage()?.sessionId;
    if (currentSession) {
      await authService.logout({ sessionId: currentSession });
    }
    clearSessionStorage();
    setAccessToken(null);
    setUser(null);
    setToken(null);
    setSessionId(null);
  }, [sessionId]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch {
      await handleLogout();
    }
  }, [handleLogout]);

  // Inicialização e restauração de sessão
  useEffect(() => {
    registerAuthExpiredHandler(() => {
      clearSessionStorage();
      setUser(null);
      setToken(null);
      setSessionId(null);
    });

    const initAuth = async () => {
      const stored = getSessionStorage();
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        setSessionId(stored.sessionId);
        // Tenta renovar o token ou carregar os dados do usuário autenticado
        const tokenRes = await authService.refreshToken({
          sessionId: stored.sessionId,
          refreshToken: stored.refreshToken,
        });

        setAccessToken(tokenRes.accessToken);
        setToken(tokenRes.accessToken);
        saveSessionStorage({
          sessionId: tokenRes.sessionId,
          refreshToken: tokenRes.refreshToken,
        });

        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch {
        clearSessionStorage();
        setUser(null);
        setToken(null);
        setSessionId(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload): Promise<void> => {
    const data = await authService.login(payload);
    setAccessToken(data.accessToken);
    saveSessionStorage({
      sessionId: data.sessionId,
      refreshToken: data.refreshToken,
    });
    setUser(data.user);
    setToken(data.accessToken);
    setSessionId(data.sessionId);
  };

  const register = async (payload: RegisterPayload): Promise<void> => {
    const data = await authService.register(payload);
    setAccessToken(data.accessToken);
    saveSessionStorage({
      sessionId: data.sessionId,
      refreshToken: data.refreshToken,
    });
    setUser(data.user);
    setToken(data.accessToken);
    setSessionId(data.sessionId);
  };

  const value: AuthContextType = {
    user,
    token,
    sessionId,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout: handleLogout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
