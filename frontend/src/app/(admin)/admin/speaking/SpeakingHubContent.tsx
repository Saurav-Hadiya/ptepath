import Link from 'next/link';
import { Mic } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { ROUTES } from '@/config/routes';
import { SPEAKING_TYPES } from './speaking-types';

export default function SpeakingHubContent() {
  return (
    <main>
      <PageHeader
        title="Speaking Question Bank"
        subtitle="Select a question type to browse, add, or edit questions."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPEAKING_TYPES.map((config) => (
          <Link
            key={config.type}
            href={ROUTES.admin.speaking.type(config.type)}
            className="group flex flex-col gap-2 rounded-card border border-border-default border-t-[3px] border-t-module-speaking bg-bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover sm:p-5"
          >
            <Mic className="size-6 text-text-primary sm:size-7" strokeWidth={1.75} />
            <div className="font-display text-label-lg text-brand-primary">{config.label}</div>
            <p className="text-body-sm text-text-secondary">{config.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
