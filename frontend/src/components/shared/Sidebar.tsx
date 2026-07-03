'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import {
  LayoutDashboard,
  Mic,
  PenLine,
  BookOpen,
  Headphones,
  Target,
  Settings,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', href: ROUTES.student.dashboard, icon: LayoutDashboard },
    ],
  },
  {
    label: 'Modules',
    items: [
      { label: 'Speaking', href: ROUTES.student.speaking.home, icon: Mic, badge: '5' },
      { label: 'Writing', href: ROUTES.student.writing.home, icon: PenLine, badge: '2' },
      { label: 'Reading', href: ROUTES.student.reading.home, icon: BookOpen, badge: '5' },
      { label: 'Listening', href: ROUTES.student.listening.home, icon: Headphones, badge: '8' },
    ],
  },
  {
    label: 'Tests',
    items: [
      { label: 'Mock Tests', href: ROUTES.student.mockTests.home, icon: Target },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', href: ROUTES.student.settings, icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

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

      {/* User info */}
      <div className="flex items-center gap-2.5 border-b border-sidebar-divider px-5 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-avatar text-label-sm font-bold text-action-hover">
          {initials}
        </div>
        <div>
          <div className="text-body-sm font-semibold text-white">{user?.name}</div>
          <div className="text-label-sm text-sidebar-text-muted">Student</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="px-5 pb-1 pt-2.5 text-label-sm uppercase tracking-wide text-sidebar-text-section">
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive =
                item.href === ROUTES.student.dashboard
                  ? pathname === ROUTES.student.dashboard
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex w-full items-center gap-2.5 px-5 py-2.5 text-body-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-action-default" />
                  )}
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                  {item.badge && (
                    <span
                      className={`ml-auto rounded-full px-[7px] py-px text-label-sm font-semibold ${
                        isActive
                          ? 'bg-sidebar-badge-active text-action-hover'
                          : 'bg-sidebar-badge text-sidebar-badge-text'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-divider p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-body-sm text-sidebar-logout transition-colors hover:bg-sidebar-hover hover:text-sidebar-logout-hover"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
