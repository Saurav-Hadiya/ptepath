import { Users, Shield, Zap, Target } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    Icon: Users,
    title: 'Receive Your Login',
    desc: 'Your instructor creates your account and sends your credentials directly — no public registration required.',
  },
  {
    step: '02',
    Icon: Shield,
    title: 'Set Your Password',
    desc: 'On your first sign-in, you set a private password that only you know before accessing the platform.',
  },
  {
    step: '03',
    Icon: Zap,
    title: 'Start Practising',
    desc: 'Access all four PTE modules and practice any question type with instant feedback and scoring.',
  },
  {
    step: '04',
    Icon: Target,
    title: 'Take Mock Tests',
    desc: 'Simulate the full PTE exam with timed mock tests to measure your readiness before test day.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-border-default bg-bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full bg-action-subtle px-4 py-1.5 text-label-sm font-semibold text-action-default">
            Getting Started
          </span>
          <h2 className="font-display text-display-md font-bold text-text-primary">How it works</h2>
          <p className="mx-auto mt-3 max-w-lg text-body-lg text-text-secondary">
            From account creation to exam-ready in four straightforward steps.
          </p>
        </div>

        <div className="relative">
          {/* Connector line — desktop only */}
          <div className="absolute left-[12.5%] right-[12.5%] top-[2.75rem] hidden h-px bg-gradient-to-r from-transparent via-border-default to-transparent lg:block" />

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map(({ step, Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="relative mb-6 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full border-2 border-border-default bg-bg-card shadow-card">
                  <Icon className="h-6 w-6 text-action-default" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-[0.6rem] font-bold tracking-tight text-white">
                    {step}
                  </span>
                </div>
                <h3 className="mb-2.5 font-display text-display-sm font-bold text-text-primary">
                  {title}
                </h3>
                <p className="text-body-sm text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
