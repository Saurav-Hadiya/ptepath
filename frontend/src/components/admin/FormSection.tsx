import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

export default function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="rounded-card border border-border-default bg-bg-card p-5">
      <div className="mb-4 border-b border-border-default pb-3 font-display text-label-lg text-brand-primary">
        {title}
      </div>
      {children}
    </div>
  );
}
