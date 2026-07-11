'use client';

import Link from 'next/link';
import { LayoutDashboard, ShieldCheck, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

interface NavUserMenuProps {
  onNavigate?: () => void;
}

export default function NavUserMenu({ onNavigate }: NavUserMenuProps) {
  const { user } = useAuthStore();
  const { mutate: logout, isPending } = useLogout();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-7 items-center gap-2 rounded-full bg-primary-foreground/10 py-0.5 pr-3.5 pl-0.5 text-label-lg text-primary-foreground transition-colors hover:bg-primary-foreground/15">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-action-default text-[11px] font-semibold text-primary-foreground">
          {getInitials(user.name)}
        </span>
        <span className="max-w-[110px] truncate">{user.name}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <div className="px-1.5 py-1.5">
          <p className="truncate text-label-md font-medium text-text-primary">{user.name}</p>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={<Link href={ROUTES.student.dashboard} onClick={onNavigate} />}
        >
          <LayoutDashboard className="h-4 w-4" />
          Student Portal
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem
            render={<Link href={ROUTES.admin.dashboard} onClick={onNavigate} />}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Portal
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            onNavigate?.();
            logout();
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

