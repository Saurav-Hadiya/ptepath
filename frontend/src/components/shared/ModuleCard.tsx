'use client';

import Link from 'next/link';
import { Mic, PenLine, BookOpen, Headphones, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ModuleType } from '@/types';

interface ModuleCardProps {
  module: ModuleType;
  questionCount?: number;
  onClick?: () => void;
  href?: string;
}

const MODULE_CONFIG: Record<ModuleType, { icon: LucideIcon; label: string; borderColor: string }> = {
  speaking: { icon: Mic, label: 'Speaking', borderColor: 'border-t-module-speaking' },
  writing: { icon: PenLine, label: 'Writing', borderColor: 'border-t-module-writing' },
  reading: { icon: BookOpen, label: 'Reading', borderColor: 'border-t-module-reading' },
  listening: { icon: Headphones, label: 'Listening', borderColor: 'border-t-module-listening' },
};

export default function ModuleCard({ module, questionCount, onClick, href }: ModuleCardProps) {
  const config = MODULE_CONFIG[module];
  const Icon = config.icon;

  const content = (
    <div
      className={`group relative w-full overflow-hidden rounded-card border border-border-default border-t-[3px] ${config.borderColor} bg-bg-card p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-hover sm:p-5`}
    >
      <Icon className="mb-2.5 size-6 text-text-primary sm:size-7" strokeWidth={1.75} />
      <div className="font-display text-label-lg text-brand-primary">{config.label}</div>
      {questionCount !== undefined && (
        <div className="mt-0.5 text-label-sm text-text-secondary">{questionCount} questions</div>
      )}
      <ChevronRight className="absolute bottom-4 right-4 size-4 text-text-muted" />
    </div>
  );

  if (href) {
    return (
      <Button
        variant="ghost"
        render={<Link href={href} />}
        className="h-auto w-full cursor-pointer rounded-card p-0 hover:bg-transparent"
      >
        {content}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="h-auto w-full cursor-pointer rounded-card p-0 hover:bg-transparent"
    >
      {content}
    </Button>
  );
}
