'use client';

import { Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNavDrawer } from '@/components/shared/AppShell';

interface TopbarProps {
  breadcrumb?: string[];
}

export default function Topbar({ breadcrumb }: TopbarProps) {
  const { user } = useAuthStore();
  const { toggle } = useNavDrawer();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-default bg-bg-card px-3 sm:px-5 lg:px-7">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-page hover:text-text-primary lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
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

      <div className="hidden shrink-0 items-center gap-2 text-body-sm text-text-secondary sm:flex">
        <span className="hidden md:inline">Welcome,</span>
        <strong className="max-w-[140px] truncate text-text-primary md:max-w-[220px]">{user?.name}</strong>
      </div>
    </header>
  );
}
