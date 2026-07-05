'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
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
  const { setOpenMobile } = useSidebar();

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
        <div className="px-4 pb-3 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-sidebar-admin-badge-border bg-sidebar-admin-badge-bg px-2 py-0.5 text-label-sm font-bold uppercase tracking-wide text-brand-accent">
            <Settings className="h-3 w-3" />
            Admin Panel
          </span>
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
                    item.href === ROUTES.admin.dashboard
                      ? pathname === ROUTES.admin.dashboard
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
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
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
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
