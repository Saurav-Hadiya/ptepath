import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  isFirstLogin: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (payload: { user: User; accessToken: string }) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: ({ user, accessToken }) =>
    set({ user, accessToken, isAuthenticated: true, isLoading: false }),
  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
