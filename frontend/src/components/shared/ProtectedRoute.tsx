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
 * Guards student/admin routes on the client.
 *
 * Middleware already blocks unauthenticated requests from ever reaching this
 * component (it never renders without a plausible session), so this only
 * has to cover two things the edge can't: (1) fetching the real access token
 * (never stored in a cookie) via a single /auth/refresh call, and (2)
 * reacting to a session becoming invalid *while the SPA is already open*
 * (token-version bump, account deactivated, cookie expired mid-session).
 *
 * The loading spinner is shown continuously through both the initial fetch
 * and any redirect-away decision — never a blank/null frame — to avoid the
 * flicker a `return null` would cause.
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
