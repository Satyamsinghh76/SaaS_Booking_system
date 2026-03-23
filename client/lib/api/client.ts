import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set. Add it to .env.local.');
}

const API_ROOT = BASE_URL.replace(/\/$/, '').endsWith('/api')
  ? BASE_URL.replace(/\/$/, '').slice(0, -4)
  : BASE_URL.replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: API_ROOT,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sends httpOnly cookie for refresh token
  timeout: 30_000,
});

// ── Request interceptor — attach access token ─────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 / token refresh ─────────
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const flushQueue = (token: string | null, error: unknown = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    token ? resolve(token) : reject(error)
  );
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{ data: { access_token: string } }>(
        `${API_ROOT}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken = data.data.access_token;
      localStorage.setItem('access_token', newToken);
      apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      flushQueue(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      flushQueue(null, refreshError);
      localStorage.removeItem('access_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
