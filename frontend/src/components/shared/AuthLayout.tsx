import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { ROUTES } from '@/config/routes';

const TRUST_POINTS = [
  'All 4 PTE modules in one platform',
  'Instant scoring on every attempt',
  'Full mock exam with real timing',
];

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Shown above the form heading on mobile top bar */
  badge?: string;
}

export default function AuthLayout({ children, badge }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">

      {/* ── Left brand panel (hidden on mobile) ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-primary p-10 lg:flex lg:w-[420px] xl:w-[480px]">
        {/* Background radial */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_100%,rgba(37,99,235,0.15),transparent)]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-accent/8 blur-3xl" />

        {/* Logo */}
        <div className="relative">
          <Logo variant="light" size="sm" />
        </div>

        {/* Centre content */}
        <div className="relative flex-1 py-12">
          <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
            <Image
              src="/images/hero-student-3.avif"
              alt="Student practising PTE"
              width={440}
              height={300}
              className="w-full object-cover object-top"
              priority
            />
          </div>

          <h2 className="mb-3 font-display text-display-sm font-bold text-white">
            Your path to PTE success starts here.
          </h2>
          <p className="mb-6 text-body-sm text-white/55">
            Practise with real exam formats, get scored instantly, and walk into exam day with confidence.
          </p>

          <ul className="space-y-2.5">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-body-sm text-white/65">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-feedback-success" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom nav */}
        <div className="relative flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-label-sm text-white/30">
            &copy; {new Date().getFullYear()} PTEPath
          </p>
          <Link
            href={ROUTES.public.landing}
            className="text-label-sm text-white/40 transition-colors hover:text-white/70"
          >
            Back to home
          </Link>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-border-default bg-bg-card px-5 py-4 lg:hidden">
          <Logo variant="dark" size="sm" />
          {badge && (
            <span className="text-label-sm uppercase tracking-widest text-text-muted">{badge}</span>
          )}
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        {/* Mobile footer */}
        <div className="border-t border-border-default bg-bg-page px-5 py-4 text-center lg:hidden">
          <p className="text-label-sm text-text-muted">
            &copy; {new Date().getFullYear()} PTEPath. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
