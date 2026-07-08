'use client';

import Link from 'next/link';
import { Mic, ArrowRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { useSpeakingCounts } from '@/hooks/queries/useSpeakingQueries';
import { ROUTES } from '@/config/routes';
import type { SpeakingQuestionType } from '@/types';

interface TypeCard {
  number: number;
  type: SpeakingQuestionType;
  slug: string;
  name: string;
  description: string;
}

const TYPE_CARDS: TypeCard[] = [
  {
    number: 1,
    type: 'read_aloud',
    slug: 'read-aloud',
    name: 'Read Aloud',
    description: 'A text passage is shown. Read it aloud clearly within the time given.',
  },
  {
    number: 2,
    type: 'repeat_sentence',
    slug: 'repeat-sentence',
    name: 'Repeat Sentence',
    description: 'Listen to a sentence and repeat it exactly as you heard it.',
  },
  {
    number: 3,
    type: 'describe_image',
    slug: 'describe-image',
    name: 'Describe Image',
    description: 'Study the image carefully then describe what you see in detail.',
  },
  {
    number: 4,
    type: 'respond_situation',
    slug: 'respond-situation',
    name: 'Respond to Situation',
    description: 'Read a situation and respond as you would in real life.',
  },
  {
    number: 5,
    type: 'answer_short',
    slug: 'answer-short-question',
    name: 'Answer Short Question',
    description: 'Listen to a short question and give a brief spoken answer.',
  },
];

export default function SpeakingModuleContent() {
  const { data: counts, isLoading, isError, refetch } = useSpeakingCounts();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Speaking Module" subtitle="5 question types · Select a type to view all questions" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
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
          title="Could not load speaking module"
          description="Please refresh the page to try again."
          action={<Button onClick={() => refetch()}>Refresh</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 rounded-card border-t-4 border-t-module-speaking border border-border-default bg-bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-module-speaking/10 sm:size-12">
            <Mic className="size-5 text-module-speaking sm:size-6" />
          </div>
          <div>
            <h1 className="font-display text-display-lg text-brand-primary">Speaking Module</h1>
            <p className="text-body-sm text-text-secondary">
              5 question types · Select a type to view all questions
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TYPE_CARDS.map((card) => {
          const count = counts?.[card.type] ?? 0;
          return (
            <Link
              key={card.type}
              href={ROUTES.student.speaking.type(card.slug)}
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
