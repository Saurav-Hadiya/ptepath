import type { ReactNode } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import AdminSidebar from '@/components/shared/AdminSidebar';
import Topbar from '@/components/shared/Topbar';
import AppShell from '@/components/shared/AppShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireRole="admin">
      <AppShell sidebar={<AdminSidebar />} topbar={<Topbar />}>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
