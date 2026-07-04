'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import {
  LayoutDashboard,
  Users,
  Mic,
  PenLine,
  BookOpen,
  Headphones,
  Target,
  Settings,
  LogOut,
} from 'lucide-react';

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: ROUTES.admin.dashboard, icon: LayoutDashboard },
    ],
  },
  {
    label: 'Students',
    items: [
      { label: 'Students', href: ROUTES.admin.students, icon: Users },
    ],
  },
  {
    label: 'Questions',
    items: [
      { label: 'Speaking', href: ROUTES.admin.speaking, icon: Mic },
      { label: 'Writing', href: ROUTES.admin.writing, icon: PenLine },
      { label: 'Reading', href: ROUTES.admin.reading, icon: BookOpen },
      { label: 'Listening', href: ROUTES.admin.listening, icon: Headphones },
    ],
  },
  {
    label: 'Tests',
    items: [
      { label: 'Mock Tests', href: ROUTES.admin.mockTests, icon: Target },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', href: ROUTES.admin.settings, icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { mutate: logout } = useLogout();

  return (
    <aside className="flex w-[260px] shrink-0 flex-col bg-brand-primary">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-sidebar-divider px-5 pb-4 pt-5">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-action-default text-label-sm font-extrabold text-white">
          PP
        </div>
        <span className="font-display text-[1.05rem] font-extrabold text-white">
          PTE<span className="text-brand-accent">Path</span>
        </span>
      </div>

      {/* Admin badge */}
      <div className="mx-5 mb-0.5 mt-2.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-sidebar-admin-badge-border bg-sidebar-admin-badge-bg px-2 py-0.5 text-label-sm font-bold uppercase tracking-wide text-brand-accent">
          <Settings className="h-3 w-3" />
          Admin Panel
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="px-5 pb-1 pt-2 text-label-sm uppercase tracking-wide text-sidebar-text-section">
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive =
                item.href === ROUTES.admin.dashboard
                  ? pathname === ROUTES.admin.dashboard
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex w-full items-center gap-2.5 px-5 py-2 text-body-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-action-default" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-divider p-2.5">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-body-sm text-sidebar-logout transition-colors hover:bg-sidebar-hover hover:text-sidebar-logout-hover"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
