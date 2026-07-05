import Link from 'next/link';
import Logo from '@/components/shared/Logo';
import { ROUTES } from '@/config/routes';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Speaking', href: '#modules' },
    { label: 'Writing', href: '#modules' },
    { label: 'Reading', href: '#modules' },
    { label: 'Listening', href: '#modules' },
    { label: 'Mock Tests', href: '#mock-test' },
  ],
  'How It Works': [
    { label: 'Getting Started', href: '#how-it-works' },
    { label: 'Practice Modules', href: '#modules' },
    { label: 'Mock Tests', href: '#mock-test' },
  ],
  Account: [
    { label: 'Sign In', href: ROUTES.public.login },
    { label: 'Forgot Password', href: ROUTES.public.forgotPassword },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="border-t border-primary-foreground/8 bg-brand-primary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-1">
            <Logo variant="light" size="sm" />
            <p className="mt-4 max-w-[200px] text-body-sm leading-relaxed text-primary-foreground/45">
              A focused PTE Academic practice platform for serious test-takers.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h3 className="mb-4 text-label-sm font-semibold uppercase tracking-widest text-primary-foreground/35">
                {group}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-primary-foreground/50 transition-colors hover:text-primary-foreground/80"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-primary-foreground/8 pt-8 text-center">
          <p className="text-label-sm text-primary-foreground/30">
            &copy; {new Date().getFullYear()} PTEPath. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
