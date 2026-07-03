'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/config/routes';

export function useAuth() {
  const { user, accessToken, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } =
    useAuthStore();
  const router = useRouter();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await authService.login(email, password);

        if (data.requiresPasswordChange && data.firstLoginToken) {
          router.push(`${ROUTES.public.changePassword}?token=${data.firstLoginToken}`);
          return { success: true, requiresPasswordChange: true };
        }

        if (data.accessToken && data.user) {
          setAuth(data.user, data.accessToken);
          router.push(data.user.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.student.dashboard);
          return { success: true };
        }

        return { success: false, error: data.message || 'Login failed' };
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'An error occurred during login';
        return { success: false, error: message };
      }
    },
    [setAuth, router]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed with client-side cleanup regardless
    }
    clearAuth();
    router.push(ROUTES.public.login);
  }, [clearAuth, router]);

  const initAuth = useCallback(async () => {
    setLoading(true);
    try {
      const refreshData = await authService.refresh();

      if (refreshData.success && refreshData.accessToken) {
        const meData = await authService.getMe(refreshData.accessToken);

        if (meData.success && meData.user) {
          setAuth(meData.user, refreshData.accessToken);
          return;
        }
      }

      clearAuth();
    } catch {
      clearAuth();
    }
  }, [setAuth, clearAuth, setLoading]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    initAuth,
  };
}
