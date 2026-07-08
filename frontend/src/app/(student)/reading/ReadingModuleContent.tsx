'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { useReadingCounts } from '@/hooks/queries/useReadingQueries';
import { ROUTES } from '@/config/routes';
import type { ReadingQuestionType } from '@/types';

interface TypeCard {
  number: number;
  type: ReadingQuestionType;
  slug: string;
  name: string;
  description: string;
  details: string;
}

const TYPE_CARDS: TypeCard[] = [
  {
    number: 1,
    type: 'rw_fill_blanks',
    slug: 'rw-fill-blanks',
    name: 'R&W Fill in the Blanks',
    description: 'Drag words from the pool into the correct blank spaces in the passage.',
    details: 'Partial credit per blank',
  },
  {
    number: 2,
    type: 'mcq_multiple',
    slug: 'mcq-multiple',
    name: 'MCQ Multiple Answers',
    description: 'Select ALL correct answers. More than one option may be correct.',
    details: 'Negative marking applies',
  },
  {
    number: 3,
    type: 'reorder_paragraphs',
    slug: 'reorder-paragraphs',
    name: 'Re-order Paragraphs',
    description: 'Drag paragraph boxes into the correct logical order.',
    details: 'Pair-based scoring',
  },
  {
    number: 4,
    type: 'reading_fill_blanks',
    slug: 'reading-fill-blanks',
    name: 'Reading Fill in the Blanks',
    description: 'Select the correct word from a dropdown for each blank in the passage.',
    details: 'Partial credit per blank',
  },
  {
    number: 5,
    type: 'mcq_single',
    slug: 'mcq-single',
    name: 'MCQ Single Answer',
    description: 'Read the passage and select ONE correct answer.',
    details: 'Binary scoring',
  },
];

export default function ReadingModuleContent() {
  const { data: counts, isLoading, isError, refetch } = useReadingCounts();

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-6 h-[92px] rounded-card" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[190px] rounded-card" />
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
          title="Could not load reading module"
          description="Please refresh the page to try again."
          action={<Button onClick={() => refetch()}>Refresh</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 rounded-card border-t-4 border-t-module-reading border border-border-default bg-bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-module-reading/10 sm:size-12">
            <BookOpen className="size-5 text-module-reading sm:size-6" />
          </div>
          <div>
            <h1 className="font-display text-display-lg text-brand-primary">Reading Module</h1>
            <p className="text-body-sm text-text-secondary">
              5 question types · Select a type to view all questions
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
              href={ROUTES.student.reading.type(card.slug)}
              className="group flex flex-col rounded-card border border-border-default bg-bg-card p-5 shadow-card transition-all hover:border-action-default hover:-translate-y-0.5 hover:shadow-hover"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-input bg-bg-page text-label-lg text-text-secondary">
                  {card.number}
                </span>
                <h3 className="font-display text-display-sm text-brand-primary">{card.name}</h3>
              </div>

              <p className="mb-2 flex-1 text-body-sm text-text-secondary">{card.description}</p>
              <p className="mb-4 text-label-sm text-text-muted">{card.details}</p>

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
