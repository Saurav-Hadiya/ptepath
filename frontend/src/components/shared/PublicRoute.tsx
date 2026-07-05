'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/config/routes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      router.replace(user.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.student.dashboard);
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return <LoadingSpinner fullPage size="lg" label="Checking your session..." />;
  }

  if (isAuthenticated) return null;

  return <>{children}</>;
}
