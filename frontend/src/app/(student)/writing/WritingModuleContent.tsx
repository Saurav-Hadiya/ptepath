'use client';

import Link from 'next/link';
import { PenLine, ArrowRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { useWritingCounts } from '@/hooks/queries/useWritingQueries';
import { ROUTES } from '@/config/routes';
import type { WritingQuestionType } from '@/types';

interface TypeCard {
  number: number;
  type: WritingQuestionType;
  slug: string;
  name: string;
  description: string;
}

const TYPE_CARDS: TypeCard[] = [
  {
    number: 1,
    type: 'summarise_written_text',
    slug: 'summarise-written-text',
    name: 'Summarise Written Text',
    description: 'Read a passage and write ONE sentence summarising the main idea.',
  },
  {
    number: 2,
    type: 'write_essay',
    slug: 'write-essay',
    name: 'Write Essay',
    description: 'Read an essay prompt and write a well-structured essay.',
  },
];

export default function WritingModuleContent() {
  const { data: counts, isLoading, isError, refetch } = useWritingCounts();

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-6 h-[92px] rounded-card" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={AlertTriangle}
          title="Could not load writing module"
          description="Please refresh the page to try again."
          action={<Button onClick={() => refetch()}>Refresh</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 rounded-card border-t-4 border-t-module-writing border border-border-default bg-bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-module-writing/10 sm:size-12">
            <PenLine className="size-5 text-module-writing sm:size-6" />
          </div>
          <div>
            <h1 className="font-display text-display-lg text-brand-primary">Writing Module</h1>
            <p className="text-body-sm text-text-secondary">
              2 question types · Select a type to view all questions
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TYPE_CARDS.map((card) => {
          const count = counts?.[card.type] ?? 0;
          return (
            <Link
              key={card.type}
              href={ROUTES.student.writing.type(card.slug)}
              className="group flex flex-col rounded-card border border-border-default bg-bg-card p-5 shadow-card transition-all hover:border-action-default hover:-translate-y-0.5 hover:shadow-hover"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-input bg-bg-page text-label-lg text-text-secondary">
                  {card.number}
                </span>
                <h3 className="font-display text-display-sm text-brand-primary">{card.name}</h3>
              </div>

              <p className="mb-4 flex-1 text-body-sm text-text-secondary">{card.description}</p>

              <div className="flex items-center justify-between">
                <Badge className="rounded-pill border-none bg-action-subtle px-2.5 py-0.5 text-label-sm text-action-default">
                  {count} questions
                </Badge>
                <span className="flex items-center gap-1 text-label-sm text-action-default opacity-0 transition-opacity group-hover:opacity-100">
                  View questions
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
