import type { ReactNode } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import AppShell from '@/components/shared/AppShell';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireRole="student">
      <AppShell sidebar={<Sidebar />} topbar={<Topbar />}>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
