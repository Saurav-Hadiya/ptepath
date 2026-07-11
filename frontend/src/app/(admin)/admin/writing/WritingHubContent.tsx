import Link from 'next/link';
import { PenLine } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { ROUTES } from '@/config/routes';
import { WRITING_TYPES } from './writing-types';

export default function WritingHubContent() {
  return (
    <main>
      <PageHeader
        title="Writing Question Bank"
        subtitle="Select a question type to browse, add, or edit questions."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WRITING_TYPES.map((config) => (
          <Link
            key={config.type}
            href={ROUTES.admin.writing.type(config.type)}
            className="group flex flex-col gap-2 rounded-card border border-border-default border-t-[3px] border-t-module-writing bg-bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover sm:p-5"
          >
            <PenLine className="size-6 text-text-primary sm:size-7" strokeWidth={1.75} />
            <div className="font-display text-label-lg text-brand-primary">{config.label}</div>
            <p className="text-body-sm text-text-secondary">{config.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
