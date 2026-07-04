'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { queryKeys } from '@/constants/QueryKeys';
import { ROUTES } from '@/config/routes';

// ─────────────────────────────────────────────────────────────────────────────
// Session initialisation — called once by AuthInitializer on app mount.
//─────────────────────────────────────────────────────────────────────────────
export function useAuthSession() {
  const { setAuth, clearAuth } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: async () => {
      try {
        const { accessToken } = await authService.refresh();
        const { user } = await authService.getMe(accessToken);
        setAuth(user, accessToken);
        return { accessToken, user };
      } catch (error) {
        clearAuth();
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Login
// On success: writes to Zustand + populates the session query cache so both
// stay consistent. Routes based on requiresPasswordChange / role.
// ─────────────────────────────────────────────────────────────────────────────
export function useLogin() {
  const { setAuth, setFirstLoginToken } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => {
      if (data.requiresPasswordChange && data.firstLoginToken) {
        setFirstLoginToken(data.firstLoginToken);
        router.push(ROUTES.public.changePassword);
        return;
      }
      if (data.accessToken && data.user) {
        setAuth(data.user, data.accessToken);
        queryClient.setQueryData(queryKeys.auth.session(), {
          accessToken: data.accessToken,
          user: data.user,
        });
        router.push(
          data.user.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.student.dashboard
        );
      }
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout
// Removes the session from the React Query cache (otherwise the stale cache
// entry persists until page reload) then clears Zustand and redirects.
// onSettled ensures cleanup runs even when the logout API call fails.
// ─────────────────────────────────────────────────────────────────────────────
export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.session() });
      clearAuth();
      router.push(ROUTES.public.login);
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Forgot password
// The page always shows a success message regardless of outcome (prevents
// email enumeration). Hook exposes isPending / isError for UX only.
// ─────────────────────────────────────────────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => authService.forgotPassword(email),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset password — token + userId come from URL query params.
// ─────────────────────────────────────────────────────────────────────────────
export function useResetPassword() {
  return useMutation({
    mutationFn: ({
      userId,
      token,
      newPassword,
      confirmPassword,
    }: {
      userId: string;
      token: string;
      newPassword: string;
      confirmPassword: string;
    }) => authService.resetPassword(userId, token, newPassword, confirmPassword),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// First-login change password
// firstLoginToken is held in Zustand memory only (never URL / localStorage).
// On success: clears the token, writes full auth to Zustand + session cache,
// then routes to the student dashboard.
// ─────────────────────────────────────────────────────────────────────────────
export function useChangePassword() {
  const { setAuth, clearFirstLoginToken } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      newPassword,
      confirmPassword,
      firstLoginToken,
    }: {
      newPassword: string;
      confirmPassword: string;
      firstLoginToken: string;
    }) => authService.changePassword(newPassword, confirmPassword, firstLoginToken),
    onSuccess: (data) => {
      clearFirstLoginToken();
      setAuth(data.user, data.accessToken);
      queryClient.setQueryData(queryKeys.auth.session(), {
        accessToken: data.accessToken,
        user: data.user,
      });
      router.push(ROUTES.student.dashboard);
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Update password — authenticated user changing their own password.
// ─────────────────────────────────────────────────────────────────────────────
export function useUpdatePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
      confirmPassword,
    }: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => authService.updatePassword(currentPassword, newPassword, confirmPassword),
  });
}
