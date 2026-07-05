'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

const NAV_LINKS = [
  { label: 'Modules', href: '#modules' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Mock Tests', href: '#mock-test' },
];

export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
              className="text-body-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={ROUTES.public.login}
            className="inline-flex h-7 items-center rounded-[min(var(--radius-md),12px)] bg-action-default px-5 text-label-lg text-white shadow-button transition-colors hover:bg-action-hover"
          >
            Login
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="text-white/80 hover:bg-white/10 hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-3/4 border-white/10 bg-brand-primary sm:max-w-xs [&>button]:text-white/80 [&>button:hover]:bg-white/10 [&>button:hover]:text-white"
        >
          <SheetHeader className="border-b border-white/10">
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
                className="rounded-lg px-3 py-2.5 text-body-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 border-t border-white/10 pt-3">
              <Link
                href={ROUTES.public.login}
                onClick={() => setMobileOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-lg bg-action-default py-2.5 text-label-lg text-white transition-colors hover:bg-action-hover"
              >
                Login to Practice
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
