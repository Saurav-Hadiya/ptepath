'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
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
  const { mutate: logout } = useLogout();
  const { setOpenMobile } = useSidebar();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <SidebarPrimitive className="border-primary-foreground/10">
      <SidebarHeader className="gap-0 border-b border-primary-foreground/10 p-0">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-action-default text-label-sm font-extrabold text-primary-foreground">
            PP
          </div>
          <span className="font-display text-[1.05rem] font-extrabold text-primary-foreground">
            PTE<span className="text-brand-accent">Path</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5 border-t border-primary-foreground/10 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-avatar text-label-sm font-bold text-action-hover">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-body-sm font-semibold text-primary-foreground">{user?.name}</div>
            <div className="text-label-sm text-sidebar-text-muted">Student</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-label-sm uppercase tracking-wide text-sidebar-text-section">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    item.href === ROUTES.student.dashboard
                      ? pathname === ROUTES.student.dashboard
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setOpenMobile(false)}
                        render={<Link href={item.href} />}
                        className={`text-body-sm font-medium ${
                          isActive
                            ? 'bg-sidebar-active text-primary-foreground data-active:bg-sidebar-active data-active:text-primary-foreground'
                            : 'text-sidebar-text hover:bg-primary-foreground/10 hover:text-primary-foreground'
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <SidebarMenuBadge
                            className={
                              isActive
                                ? 'bg-sidebar-badge-active text-action-hover'
                                : 'bg-sidebar-badge text-sidebar-badge-text'
                            }
                          >
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-primary-foreground/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout()}
              className="text-body-sm text-sidebar-logout hover:bg-primary-foreground/10 hover:text-sidebar-logout-hover"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
