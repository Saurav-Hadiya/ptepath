import type { ReactNode } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import AdminSidebar from '@/components/shared/AdminSidebar';
import Topbar from '@/components/shared/Topbar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireRole="admin">
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-bg-page p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
