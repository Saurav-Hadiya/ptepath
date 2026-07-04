import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  /** Held in memory only — never persisted. Used exclusively for the first-login change-password flow. */
  firstLoginToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setAccessToken: (token: string) => void;
  setFirstLoginToken: (token: string) => void;
  clearFirstLoginToken: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  firstLoginToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, isLoading: false }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      firstLoginToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setAccessToken: (token) => set({ accessToken: token }),

  setFirstLoginToken: (token) => set({ firstLoginToken: token }),

  clearFirstLoginToken: () => set({ firstLoginToken: null }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
