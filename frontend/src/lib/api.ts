import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { env } from '@/lib/env';

const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !isRefreshing) {
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${env.apiUrl}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        useAuthStore.getState().setAuth({
          user: useAuthStore.getState().user!,
          accessToken: data.accessToken,
        });
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
