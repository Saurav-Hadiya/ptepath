'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuestionTypeCardProps {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  count: number;
  avgScore: number | null;
  accentClassName?: string;
}

function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-feedback-success';
  if (score >= 50) return 'text-feedback-warning';
  return 'text-feedback-error';
}

export default function QuestionTypeCard({
  href,
  icon: Icon,
  label,
  description,
  count,
  avgScore,
  accentClassName = 'border-t-module-speaking',
}: QuestionTypeCardProps) {
  return (
    <Button
      variant="ghost"
      nativeButton={false}
      render={<Link href={href} />}
      className="h-auto w-full cursor-pointer rounded-card p-0 hover:bg-transparent"
    >
      <div
        className={`group relative w-full overflow-hidden rounded-card border border-border-default border-t-[3px] ${accentClassName} bg-bg-card p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-hover sm:p-5`}
      >
        <Icon className="mb-2.5 size-6 text-text-primary sm:size-7" strokeWidth={1.75} />
        <div className="font-display text-label-lg text-brand-primary">{label}</div>
        <p className="mt-0.5 text-body-sm text-text-secondary">{description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className={`text-label-sm ${count > 0 ? 'text-text-secondary' : 'text-text-muted'}`}>
            {count > 0 ? `${count} question${count === 1 ? '' : 's'}` : 'No questions yet'}
          </span>
          {avgScore !== null && (
            <span className={`text-label-sm font-semibold ${scoreColorClass(avgScore)}`}>
              Avg score: {avgScore}
            </span>
          )}
        </div>

        <ChevronRight className="absolute bottom-4 right-4 size-4 text-text-muted" />
      </div>
    </Button>
  );
}
