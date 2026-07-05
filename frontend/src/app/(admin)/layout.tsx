import type { ReactNode } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import AdminSidebar from '@/components/shared/AdminSidebar';
import Topbar from '@/components/shared/Topbar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireRole="admin">
      <SidebarProvider className="min-h-0 pt-[68px]">
        <AdminSidebar />
        <SidebarInset className="h-[calc(100dvh-68px)] overflow-hidden">
          <Topbar />
          <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-bg-page p-3 sm:p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
