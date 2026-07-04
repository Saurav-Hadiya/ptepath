import { Zap, Target, BarChart3, Mic, Shield, Users } from 'lucide-react';

const BENEFITS = [
  {
    Icon: Zap,
    iconBg: 'bg-action-subtle',
    iconColor: 'text-action-default',
    title: 'Instant Feedback',
    desc: 'Get scored immediately after every answer across all question types — no waiting, no guessing.',
  },
  {
    Icon: Target,
    iconBg: 'bg-feedback-success-bg',
    iconColor: 'text-feedback-success',
    title: 'PTE-Aligned Format',
    desc: 'Every question type mirrors the actual PTE Academic exam so you practise exactly what you will be tested on.',
  },
  {
    Icon: BarChart3,
    iconBg: 'bg-action-subtle',
    iconColor: 'text-action-default',
    title: 'Progress Tracking',
    desc: 'Monitor your performance trends across all modules with rolling average scores that reflect true improvement.',
  },
  {
    Icon: Mic,
    iconBg: 'bg-module-speaking/10',
    iconColor: 'text-module-speaking',
    title: 'AI Speech Scoring',
    desc: 'Speaking responses are evaluated by advanced AI speech recognition, scoring fluency, pronunciation, and content.',
  },
  {
    Icon: Shield,
    iconBg: 'bg-feedback-success-bg',
    iconColor: 'text-feedback-success',
    title: 'Secure & Private',
    desc: 'Your practice data is private. Audio is never stored. Accounts are protected with secure authentication.',
  },
  {
    Icon: Users,
    iconBg: 'bg-bg-accent',
    iconColor: 'text-brand-accent',
    title: 'Instructor-Managed',
    desc: 'Only students enrolled by an instructor can access — a focused, distraction-free environment every session.',
  },
];

export default function WhySection() {
  return (
    <section className="bg-bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full bg-action-subtle px-4 py-1.5 text-label-sm font-semibold text-action-default">
            Why PTEPath
          </span>
          <h2 className="font-display text-display-md font-bold text-text-primary">
            Everything you need to succeed
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-body-lg text-text-secondary">
            Built specifically for PTE preparation. No distractions, no fluff — just focused practice that works.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ Icon, iconBg, iconColor, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-hover"
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <h3 className="mb-2 font-display text-display-sm font-bold text-text-primary">{title}</h3>
              <p className="text-body-sm text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
