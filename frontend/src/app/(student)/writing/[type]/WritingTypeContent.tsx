'use client';

import Link from 'next/link';
import { ArrowRight, PenLine, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumb from '@/components/shared/Breadcrumb';
import EmptyState from '@/components/shared/EmptyState';
import { useWritingList } from '@/hooks/queries/useWritingQueries';
import { ROUTES } from '@/config/routes';

const SLUG_TO_TYPE: Record<string, string> = {
  'summarise-written-text': 'summarise_written_text',
  'write-essay': 'write_essay',
};

const SLUG_TO_NAME: Record<string, string> = {
  'summarise-written-text': 'Summarise Written Text',
  'write-essay': 'Write Essay',
};

const SLUG_TO_DESC: Record<string, string> = {
  'summarise-written-text':
    'Read a passage and write ONE sentence summarising the main idea.',
  'write-essay': 'Read an essay prompt and write a well-structured essay',
};

interface Props {
  slug: string;
}

export default function WritingTypeContent({ slug }: Props) {
  const apiType = SLUG_TO_TYPE[slug] ?? slug;
  const typeName = SLUG_TO_NAME[slug] ?? slug;
  const typeDesc = SLUG_TO_DESC[slug] ?? '';
  const { data, isLoading, isError, refetch } = useWritingList(apiType);

  if (isLoading) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Writing', href: ROUTES.student.writing.home }, { label: typeName }]} />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-card" />
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
          title="Could not load questions"
          description="Please refresh the page to try again."
          action={<Button onClick={() => refetch()}>Refresh</Button>}
        />
      </div>
    );
  }

  const questions = data?.questions ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Writing', href: ROUTES.student.writing.home }, { label: typeName }]} />

      <div className="mt-4 mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-display-lg text-brand-primary">{typeName}</h1>
          <p className="mt-1 text-body-sm text-text-secondary">{typeDesc}</p>
        </div>
        <Badge className="w-fit rounded-pill border-none bg-action-subtle px-3 py-1 text-label-sm text-action-default">
          {total} questions
        </Badge>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title="No questions available"
          description="Your instructor has not added any questions yet."
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, index) => (
            <Link
              key={q.id}
              href={ROUTES.student.writing.question(slug, q.id)}
              className="group flex items-center gap-3 rounded-card border border-border-default bg-bg-card p-4 shadow-card transition-all hover:border-action-default hover:shadow-hover sm:gap-4"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-input bg-bg-page text-label-lg text-text-secondary sm:size-10">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md text-text-primary">
                  {q.preview ? `${q.preview}...` : `${typeName} Question ${index + 1}`}
                </p>
              </div>

              <Button
                size="sm"
                className="shrink-0 gap-1 bg-action-default text-primary-foreground hover:bg-action-hover"
              >
                <span className="hidden sm:inline">Attempt</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
