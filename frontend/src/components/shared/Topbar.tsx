'use client';

import { useAuthStore } from '@/store/auth.store';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface TopbarProps {
  breadcrumb?: string[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Topbar({ breadcrumb }: TopbarProps) {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-default bg-bg-card px-3 sm:px-5 lg:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="shrink-0 text-text-secondary hover:bg-bg-page hover:text-text-primary md:hidden" />
        <div className="flex min-w-0 items-center gap-2 truncate text-body-sm text-text-muted">
          {breadcrumb && breadcrumb.length > 0 ? (
            breadcrumb.map((crumb, i) => (
              <span key={i} className="truncate">
                {i > 0 && <span className="mx-1">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'font-medium text-text-primary' : ''}>
                  {crumb}
                </span>
              </span>
            ))
          ) : (
            <span className="font-medium text-text-primary">Dashboard</span>
          )}
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-1 text-body-sm text-text-secondary">
        <span className="hidden shrink-0 sm:inline">{getGreeting()},</span>
        <strong className="max-w-[90px] truncate text-text-primary sm:max-w-[140px] md:max-w-[220px]">
          {firstName}
        </strong>
      </div>
    </header>
  );
}
