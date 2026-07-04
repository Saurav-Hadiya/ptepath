import Image from 'next/image';
import { CheckCircle2, Clock, Target, BarChart3, RefreshCw } from 'lucide-react';

const POINTS = [
  'All 4 modules in a single timed session — just like the real exam',
  'Instant section-wise score breakdown after completion',
  'Real PTE question formats and difficulty levels throughout',
  'Unlimited retakes to track your improvement over time',
  'Detailed performance review after every test attempt',
];

const STATS = [
  { value: '18+', label: 'Question Types', Icon: Target },
  { value: '90 min', label: 'Full Exam Duration', Icon: Clock },
  { value: '4', label: 'Complete Modules', Icon: BarChart3 },
  { value: 'Unlimited', label: 'Retakes Allowed', Icon: RefreshCw },
];

export default function MockTestSection() {
  return (
    <section id="mock-test" className="bg-brand-primary py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Left: Text */}
          <div>
            <span className="mb-4 inline-block rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1.5 text-label-sm text-brand-accent">
              Mock Tests
            </span>
            <h2 className="mb-5 font-display text-display-md font-bold text-white">
              Experience the full exam before test day
            </h2>
            <p className="mb-8 text-body-lg leading-relaxed text-white/60">
              Our mock tests mirror the actual PTE Academic exam format across all four modules
              with real timing and comprehensive scoring — so you build confidence before the real thing.
            </p>
            <ul className="space-y-3.5">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-body-sm text-white/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-feedback-success" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Stats grid + image */}
          <div className="flex flex-col gap-6">
            {/* Student image */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <Image
                src="/images/hero-student-2.avif"
                alt="Student taking mock PTE exam"
                width={560}
                height={260}
                className="w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/60 to-transparent" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map(({ value, label, Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center"
                >
                  <Icon className="mx-auto mb-2.5 h-5 w-5 text-brand-accent" />
                  <div className="font-display text-display-sm font-extrabold leading-none tracking-tight text-white">
                    {value}
                  </div>
                  <div className="mt-1.5 text-label-sm text-white/50">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
