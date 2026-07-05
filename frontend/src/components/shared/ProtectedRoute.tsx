'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/config/routes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

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
    return <LoadingSpinner fullPage size="lg" label="Checking your session..." />;
  }

  if (!isAuthenticated) return null;

  if (requireRole === 'admin' && user?.role !== 'admin') return null;

  return <>{children}</>;
}
