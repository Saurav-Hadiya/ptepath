'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/config/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'student' | 'admin';
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.public.login);
      return;
    }

    if (requireRole === 'admin' && user?.role !== 'admin') {
      router.replace(ROUTES.student.dashboard);
      return;
    }
  }, [isAuthenticated, isLoading, user, requireRole, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-page">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-action-default border-t-transparent" />
          <p className="text-body-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (requireRole === 'admin' && user?.role !== 'admin') return null;

  return <>{children}</>;
}
