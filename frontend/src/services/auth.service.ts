import axios from 'axios';
import api from '@/lib/api';
import { env } from '@/lib/env';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type { User } from '@/types';

interface LoginResponse {
  success: boolean;
  message?: string;
  requiresPasswordChange?: boolean;
  firstLoginToken?: string;
  accessToken?: string;
  user?: User;
}

interface RefreshResponse {
  success: boolean;
  accessToken: string;
}

interface MeResponse {
  success: boolean;
  user: User;
}

export const authService = {
  login(email: string, password: string) {
    return api
      .post<LoginResponse>(API_ENDPOINTS.auth.login, { email, password })
      .then((r) => r.data);
  },

  logout() {
    return api.post(API_ENDPOINTS.auth.logout).then((r) => r.data);
  },

  refresh() {
    return axios
      .post<RefreshResponse>(`${env.apiUrl}${API_ENDPOINTS.auth.refresh}`, {}, { withCredentials: true })
      .then((r) => r.data);
  },

  getMe(accessToken: string) {
    return axios
      .get<MeResponse>(`${env.apiUrl}${API_ENDPOINTS.auth.me}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((r) => r.data);
  },

  changePassword(newPassword: string) {
    return api
      .post(API_ENDPOINTS.auth.changePassword, { newPassword })
      .then((r) => r.data);
  },

  forgotPassword(email: string) {
    return api
      .post(API_ENDPOINTS.auth.forgotPassword, { email })
      .then((r) => r.data);
  },

  resetPassword(userId: string, token: string, newPassword: string) {
    return api
      .post(API_ENDPOINTS.auth.resetPassword, { userId, token, newPassword })
      .then((r) => r.data);
  },

  updatePassword(currentPassword: string, newPassword: string) {
    return api
      .post(API_ENDPOINTS.auth.updatePassword, { currentPassword, newPassword })
      .then((r) => r.data);
  },
};
