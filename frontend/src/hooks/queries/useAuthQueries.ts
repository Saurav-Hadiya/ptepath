'use client';

import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

export function useLoginMutation() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => authService.logout(),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) =>
      authService.forgotPassword(email),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ userId, token, newPassword }: { userId: string; token: string; newPassword: string }) =>
      authService.resetPassword(userId, token, newPassword),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({ newPassword }: { newPassword: string }) =>
      authService.changePassword(newPassword),
  });
}

export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.updatePassword(currentPassword, newPassword),
  });
}
