import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ROUTES } from "@/config/routes";

const TRUST_POINTS = [
  "All 4 PTE modules — Speaking, Writing, Reading, Listening",
  "Real exam question formats with instant scoring",
  "Full mock test with timed conditions",
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-brand-primary pt-[68px]">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_60%_0%,rgba(37,99,235,0.12),transparent)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand-accent/5 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 md:flex-row md:items-center md:gap-10 md:py-16 lg:gap-16 lg:px-8 lg:py-24">
        {/* Left: Text content */}
        <div className="flex-1 text-center md:text-left">
          {/* Eyebrow badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/10 bg-primary-foreground/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-accent" />
            <span className="text-label-sm text-primary-foreground/65">
              PTE Academic Practice Platform
            </span>
          </div>

          <h1 className="mb-5 font-display text-display-xl font-extrabold leading-[1.06] tracking-tight text-primary-foreground">
            The smarter way to <br className="hidden sm:block" />
            <span className="bg-gradient-to-r bg-clip-text text-transparent">
              prepare for PTE.
            </span>
          </h1>

          <p className="mb-8 text-body-lg leading-relaxed text-primary-foreground/60 md:max-w-lg">
            A focused practice platform for PTE Academic test-takers. Sharpen
            every skill with real exam question formats and immediate feedback
            on every attempt.
          </p>

          {/* Trust points */}
          <ul className="mb-8 space-y-2.5">
            {TRUST_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start justify-center gap-2.5 text-body-sm text-primary-foreground/65 md:justify-start"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-feedback-success" />
                {point}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Link
              href={ROUTES.public.login}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-action-default px-8 py-3 text-label-lg text-primary-foreground shadow-button transition-all hover:bg-action-hover sm:w-auto"
            >
              Start Practising
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#modules"
              className="inline-flex w-full items-center justify-center rounded-xl border border-primary-foreground/20 px-8 py-3 text-label-lg text-primary-foreground/80 transition-all hover:border-primary-foreground/35 hover:bg-primary-foreground/5 sm:w-auto"
            >
              Explore Modules
            </a>
          </div>
        </div>

        {/* Right: Student image */}
        <div className="relative w-full max-w-[320px] shrink-0 sm:max-w-[380px] md:w-[300px] md:max-w-none lg:w-[400px] xl:w-[460px]">
          {/* Decorative ring */}
          <div className="absolute -inset-4 rounded-[28px] border border-primary-foreground/5" />

          <div className="relative overflow-hidden rounded-2xl border border-primary-foreground/10 shadow-[0_32px_64px_rgba(0,0,0,0.4)]">
            <Image
              src="/images/hero-student-1.avif"
              alt="PTE student practising"
              width={480}
              height={560}
              className="w-full object-cover object-top"
              priority
            />
            {/* Dark gradient at bottom for badge */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a1133]/90 to-transparent" />
          </div>
        </div>
      </div>

      {/* Wave transition to light bg */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
            fill="var(--bg-page)"
          />
        </svg>
      </div>
    </section>
  );
}
