import type { ReactNode } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireRole="student">
      <div className="flex h-screen">
        <Sidebar />
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
