'use client';

import Link from 'next/link';
import { Headphones, ArrowRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import { useListeningCounts } from '@/hooks/queries/useListeningQueries';
import { ROUTES } from '@/config/routes';
import type { ListeningQuestionType } from '@/types';

interface TypeCard {
  number: number;
  type: ListeningQuestionType;
  slug: string;
  name: string;
  description: string;
  details: string;
}

const TYPE_CARDS: TypeCard[] = [
  {
    number: 1,
    type: 'summarise_spoken',
    slug: 'summarise-spoken',
    name: 'Summarise Spoken Text',
    description: 'Listen to audio and write a summary.',
    details: 'Word count + spelling scored',
  },
  {
    number: 2,
    type: 'mcq_multiple',
    slug: 'mcq-multiple',
    name: 'MCQ Multiple Answers',
    description: 'Listen and select ALL correct answers.',
    details: 'Negative marking applies',
  },
  {
    number: 3,
    type: 'fill_blanks',
    slug: 'fill-blanks',
    name: 'Fill in the Blanks',
    description: 'Listen and type missing words into the transcript.',
    details: 'Fuzzy matching — typos forgiven',
  },
  {
    number: 4,
    type: 'highlight_summary',
    slug: 'highlight-correct-summary',
    name: 'Highlight Correct Summary',
    description: 'Listen and select which summary best matches.',
    details: 'Binary scoring',
  },
  {
    number: 5,
    type: 'mcq_single',
    slug: 'mcq-single',
    name: 'MCQ Single Answer',
    description: 'Listen and select ONE correct answer.',
    details: 'Binary scoring',
  },
  {
    number: 6,
    type: 'select_missing',
    slug: 'select-missing-word',
    name: 'Select Missing Word',
    description: 'Listen and select the word that completes the audio.',
    details: 'Binary scoring',
  },
  {
    number: 7,
    type: 'highlight_incorrect',
    slug: 'highlight-incorrect-words',
    name: 'Highlight Incorrect Words',
    description: 'Listen and click words in the transcript that differ from the audio.',
    details: 'Negative marking applies',
  },
  {
    number: 8,
    type: 'write_dictation',
    slug: 'write-dictation',
    name: 'Write from Dictation',
    description: 'Listen and type exactly what you hear.',
    details: 'Word match + spelling scored',
  },
];

export default function ListeningModuleContent() {
  const { data: counts, isLoading, isError, refetch } = useListeningCounts();

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-6 h-[92px] rounded-card" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
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
          title="Could not load listening module"
          description="Please refresh the page to try again."
          action={<Button onClick={() => refetch()}>Refresh</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 rounded-card border-t-4 border-t-module-listening border border-border-default bg-bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-module-listening/10 sm:size-12">
            <Headphones className="size-5 text-module-listening sm:size-6" />
          </div>
          <div>
            <h1 className="font-display text-display-lg text-brand-primary">Listening Module</h1>
            <p className="text-body-sm text-text-secondary">
              8 question types · Select a type to view all questions
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
              href={ROUTES.student.listening.type(card.slug)}
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

              <div className="flex items-center justify-between gap-2">
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
