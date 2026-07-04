import { Mic, PenLine, BookOpen, Headphones, Target } from 'lucide-react';

const FEATURES = [
  { Icon: Mic, label: 'Speaking', sub: '5 question types', color: 'text-module-speaking' },
  { Icon: PenLine, label: 'Writing', sub: '2 question types', color: 'text-module-writing' },
  { Icon: BookOpen, label: 'Reading', sub: '5 question types', color: 'text-module-reading' },
  { Icon: Headphones, label: 'Listening', sub: '8 question types', color: 'text-module-listening' },
  { Icon: Target, label: 'Mock Tests', sub: 'Full exam format', color: 'text-text-secondary' },
];

export default function FeaturesStrip() {
  return (
    <section className="bg-bg-page py-4 sm:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-card">
          <div className="grid grid-cols-2 divide-x divide-y divide-border-default sm:grid-cols-5 sm:divide-y-0">
            {FEATURES.map(({ Icon, label, sub, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-5 py-4 sm:py-5"
              >
                <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                <div className="min-w-0">
                  <p className="text-label-md font-semibold text-text-primary">{label}</p>
                  <p className="text-label-sm text-text-muted">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
