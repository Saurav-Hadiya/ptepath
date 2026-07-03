import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center sm:px-6 sm:py-10">
      <Icon className="size-8 text-text-muted sm:size-9" strokeWidth={1.5} />
      <span className="font-display text-display-sm text-text-secondary">{title}</span>
      {description && <p className="text-body-sm text-text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
