'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useAuthSession } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'student' | 'admin';
}

/**
 * Guards student/admin routes on the client — no middleware equivalent
 * exists since the refresh cookie belongs to the backend's domain, not
 * ours. Fetches the access token via useAuthSession and redirects on auth
 * failure or role mismatch. Always shows the spinner, never a blank frame,
 * while loading or redirecting.
 */
export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { isLoading, isError } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();

  const roleMismatch = requireRole !== undefined && user?.role !== requireRole;
  const shouldRedirect = !isLoading && (isError || !isAuthenticated || roleMismatch);

  useEffect(() => {
    if (!shouldRedirect) return;

    if (isError || !isAuthenticated) {
      const loginUrl = new URL(ROUTES.public.login, window.location.origin);
      loginUrl.searchParams.set('redirect', pathname);
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      return;
    }

    if (roleMismatch) {
      router.replace(user?.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.student.dashboard);
    }
  }, [shouldRedirect, isError, isAuthenticated, roleMismatch, user?.role, pathname, router]);

  if (isLoading || shouldRedirect) {
    return <LoadingSpinner fullPage size="lg" label="Checking your session..." />;
  }

  return <>{children}</>;
}
