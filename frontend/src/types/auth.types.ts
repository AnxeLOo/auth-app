export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{ path?: string; message: string }>;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RefreshPayload {
  sessionId: string;
  refreshToken: string;
}

export interface LogoutPayload {
  sessionId?: string;
  refreshToken?: string;
}
