'use client';

import { useAuthStore } from '@/store/auth.store';

interface TopbarProps {
  breadcrumb?: string[];
}

export default function Topbar({ breadcrumb }: TopbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-default bg-bg-card px-7">
      <div className="flex items-center gap-2 text-body-sm text-text-muted">
        {breadcrumb && breadcrumb.length > 0 ? (
          breadcrumb.map((crumb, i) => (
            <span key={i}>
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

      <div className="flex items-center gap-3 text-body-sm text-text-secondary">
        Welcome, <strong className="text-text-primary">{user?.name}</strong>
      </div>
    </header>
  );
}
