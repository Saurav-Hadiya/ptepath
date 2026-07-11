'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, LayoutDashboard, ShieldCheck, LogOut } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import NavUserMenu, { getInitials } from '@/components/shared/NavUserMenu';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useAuthSession, useLogout } from '@/hooks/useAuth';

const NAV_LINKS = [
  { label: 'Modules', href: '#modules' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Mock Tests', href: '#mock-test' },
];

export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data, isLoading: isSessionLoading } = useAuthSession();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const user = data?.user ?? null;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'bg-brand-primary shadow-modal' : 'bg-brand-primary/95 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo variant="light" size="md" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-body-sm font-medium text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              {link.label}
            </a>
          ))}
          {isSessionLoading ? (
            <Skeleton className="h-7 w-24 rounded-full bg-primary-foreground/10" />
          ) : user ? (
            <NavUserMenu />
          ) : (
            <Link
              href={ROUTES.public.login}
              className="inline-flex h-7 items-center rounded-[min(var(--radius-md),12px)] bg-action-default px-5 text-label-lg text-primary-foreground shadow-button transition-colors hover:bg-action-hover"
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-3/4 border-primary-foreground/10 bg-brand-primary sm:max-w-xs [&>button]:text-primary-foreground/80 [&>button:hover]:bg-primary-foreground/10 [&>button:hover]:text-primary-foreground"
        >
          <SheetHeader className="border-b border-primary-foreground/10">
            <SheetTitle>
              <Logo variant="light" size="sm" />
            </SheetTitle>
            <SheetDescription className="sr-only">Site navigation menu</SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-body-sm font-medium text-primary-foreground/75 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 border-t border-primary-foreground/10 pt-3">
              {isSessionLoading ? (
                <div className="flex items-center gap-2.5 px-3 py-1.5">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-primary-foreground/10" />
                  <Skeleton className="h-4 w-24 rounded bg-primary-foreground/10" />
                </div>
              ) : user ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5 px-3 py-1.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action-default text-label-sm font-semibold text-primary-foreground">
                      {getInitials(user.name)}
                    </span>
                    <p className="truncate text-label-md font-medium text-primary-foreground">{user.name}</p>
                  </div>
                  <Link
                    href={ROUTES.student.dashboard}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-body-sm font-medium text-primary-foreground/85 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Student Portal
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href={ROUTES.admin.dashboard}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-body-sm font-medium text-primary-foreground/85 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Admin Portal
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-body-sm font-medium text-feedback-error transition-colors hover:bg-feedback-error-bg disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href={ROUTES.public.login}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-action-default py-2.5 text-label-lg text-primary-foreground transition-colors hover:bg-action-hover"
                >
                  Login to Practice
                </Link>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
