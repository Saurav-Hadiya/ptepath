import axios from 'axios';
import api from '@/lib/api';
import { env } from '@/lib/env';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type { User } from '@/types';

// ── Response types ────────────────────────────────────────────

export interface LoginResponse {
  success: boolean;
  message?: string;
  requiresPasswordChange?: boolean;
  firstLoginToken?: string;
  accessToken?: string;
  user?: User;
}

export interface AuthSuccessResponse {
  success: boolean;
  message: string;
  accessToken: string;
  user: User;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  accessToken: string;
}

export interface MeResponse {
  success: boolean;
  user: User;
}

// ── Service 

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data } = await api.post<LoginResponse>(API_ENDPOINTS.auth.login, { email, password });
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async logout(): Promise<MessageResponse> {
    try {
      const { data } = await api.post<MessageResponse>(API_ENDPOINTS.auth.logout);
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async refresh(): Promise<RefreshResponse> {
    try {
      const { data } = await axios.post<RefreshResponse>(
        `${env.apiUrl}${API_ENDPOINTS.auth.refresh}`,
        {},
        { withCredentials: true }
      );
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getMe(accessToken: string): Promise<MeResponse> {
    try {
      const { data } = await axios.get<MeResponse>(
        `${env.apiUrl}${API_ENDPOINTS.auth.me}`,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * First-login password change.
   * Must use raw axios — NOT the `api` instance — because the api instance's
   * request interceptor injects the regular accessToken, but this endpoint
   * requires the firstLoginToken (a short-lived JWT with isFirstLogin: true).
   */
  async changePassword(
    newPassword: string,
    confirmPassword: string,
    firstLoginToken: string
  ): Promise<AuthSuccessResponse> {
    try {
      const { data } = await axios.post<AuthSuccessResponse>(
        `${env.apiUrl}${API_ENDPOINTS.auth.changePassword}`,
        { newPassword, confirmPassword },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${firstLoginToken}`,
          },
        }
      );
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async forgotPassword(email: string): Promise<MessageResponse> {
    try {
      const { data } = await api.post<MessageResponse>(
        API_ENDPOINTS.auth.forgotPassword,
        { email }
      );
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async resetPassword(
    userId: string,
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<MessageResponse> {
    try {
      const { data } = await api.post<MessageResponse>(
        API_ENDPOINTS.auth.resetPassword,
        { userId, token, newPassword, confirmPassword }
      );
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async updatePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<MessageResponse> {
    try {
      const { data } = await api.post<MessageResponse>(
        API_ENDPOINTS.auth.updatePassword,
        { currentPassword, newPassword, confirmPassword }
      );
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
