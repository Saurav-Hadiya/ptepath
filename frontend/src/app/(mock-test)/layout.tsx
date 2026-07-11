import type { ReactNode } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

/**
 * Full-screen exam layout — deliberately outside the (student) route group so
 * it never inherits Sidebar/Topbar (a fixed overlay covering them while they
 * stay mounted underneath is not the same thing). Still auth-guarded via
 * ProtectedRoute; this route group only opts out of the persistent chrome.
 */
export default function MockTestLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireRole="student">
      <div className="h-svh w-full overflow-hidden bg-bg-page">{children}</div>
    </ProtectedRoute>
  );
}
