import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const TRUST_POINTS = [
  "All 4 PTE modules in one platform",
  "Instant scoring on every attempt",
  "Full mock exam with real timing",
];

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Shown as a small pill above the form heading on mobile/tablet */
  badge?: string;
}

export default function AuthLayout({ children, badge }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col pt-[68px] lg:flex-row lg:pt-0">
      {/* ── Left brand panel (hidden below lg) ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-primary p-10 lg:flex lg:w-[420px] xl:w-[480px]">
        {/* Background radial */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_100%,rgba(37,99,235,0.15),transparent)]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-accent/8 blur-3xl" />

        {/* Centre content */}
        <div className="relative flex-1 py-2">
          <div className="mb-8 overflow-hidden rounded-2xl border border-primary-foreground/10 shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
            <Image
              src="/images/hero-student-3.avif"
              alt="Student practising PTE"
              width={440}
              height={300}
              className="w-full object-cover object-top"
              priority
            />
          </div>

          <h2 className="mb-3 font-display text-display-sm font-bold text-primary-foreground">
            Your path to PTE success starts here.
          </h2>
          <p className="mb-6 text-body-sm text-primary-foreground/55">
            Practise with real exam formats, get scored instantly, and walk into
            exam day with confidence.
          </p>

          <ul className="space-y-2.5">
            {TRUST_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-2.5 text-body-sm text-primary-foreground/65"
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-feedback-success" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <div className="relative border-t border-primary-foreground/10 pt-6">
          <p className="text-label-sm text-primary-foreground/30">
            &copy; {new Date().getFullYear()} PTEPath. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-page">
        {/* Decorative accent — visible only where the brand panel is hidden */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(37,99,235,0.12),transparent)]" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-accent/10 blur-3xl" />
        </div>

        {/* Form area */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-14">
          {badge && (
            <span className="mb-5 inline-flex items-center rounded-full border border-border-default bg-bg-card px-3.5 py-1 text-label-sm font-semibold uppercase tracking-widest text-action-default shadow-card lg:hidden">
              {badge}
            </span>
          )}

          <div className="w-full max-w-[420px] rounded-modal border border-border-default bg-bg-card p-6 shadow-card sm:p-8 lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
