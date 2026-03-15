import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    access_token: string;
  };
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ── API calls ──────────────────────────────────────────────────

export interface SignupResponse {
  success: boolean;
  message: string;
  data: { requiresVerification: boolean; email: string };
}

/**
 * POST /api/auth/signup
 * Registers a new user. Does NOT log them in — they must verify email first.
 */
export const signup = async (payload: SignupPayload): Promise<SignupResponse> => {
  const { data } = await apiClient.post<SignupResponse>('/api/auth/signup', payload);
  return data;
};

/**
 * POST /api/auth/login
 * Authenticates and returns tokens + user profile.
 * Stores the access token in localStorage for subsequent requests.
 */
export const login = async (payload: LoginPayload): Promise<User> => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
  localStorage.setItem('access_token', data.data.access_token);
  return data.data.user;
};

/**
 * POST /api/auth/logout
 * Revokes the refresh token and clears the stored access token.
 */
export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
  localStorage.removeItem('access_token');
};

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
/**
 * POST /api/auth/google
 * Sends the Google ID token credential to the backend for verification.
 */
export const googleLogin = async (credential: string): Promise<User> => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/google', { credential });
  localStorage.setItem('access_token', data.data.access_token);
  return data.data.user;
};

export const getMe = async (): Promise<User> => {
  const { data } = await apiClient.get<{ success: boolean; data: User }>('/api/auth/me');
  return data.data;
};
