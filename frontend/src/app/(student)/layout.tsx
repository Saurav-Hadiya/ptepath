import type { ReactNode } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireRole="student">
      <SidebarProvider className="min-h-svh">
        <Sidebar />
        <SidebarInset className="h-svh overflow-hidden">
          <Topbar />
          <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-bg-page p-3 sm:p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
