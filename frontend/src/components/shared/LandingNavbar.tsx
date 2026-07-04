'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { ROUTES } from '@/config/routes';

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
        <button
          className="inline-flex items-center justify-center rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-brand-primary px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
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
        </div>
      )}
    </header>
  );
}
