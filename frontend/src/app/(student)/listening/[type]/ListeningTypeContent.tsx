'use client';

import Link from 'next/link';
import { ArrowRight, Headphones, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumb from '@/components/shared/Breadcrumb';
import EmptyState from '@/components/shared/EmptyState';
import { useListeningList } from '@/hooks/queries/useListeningQueries';
import { ROUTES } from '@/config/routes';

const SLUG_TO_TYPE: Record<string, string> = {
  'summarise-spoken': 'summarise_spoken',
  'mcq-multiple': 'mcq_multiple',
  'fill-blanks': 'fill_blanks',
  'highlight-correct-summary': 'highlight_summary',
  'mcq-single': 'mcq_single',
  'select-missing-word': 'select_missing',
  'highlight-incorrect-words': 'highlight_incorrect',
  'write-dictation': 'write_dictation',
};

const SLUG_TO_NAME: Record<string, string> = {
  'summarise-spoken': 'Summarise Spoken Text',
  'mcq-multiple': 'MCQ Multiple Answers',
  'fill-blanks': 'Fill in the Blanks',
  'highlight-correct-summary': 'Highlight Correct Summary',
  'mcq-single': 'MCQ Single Answer',
  'select-missing-word': 'Select Missing Word',
  'highlight-incorrect-words': 'Highlight Incorrect Words',
  'write-dictation': 'Write from Dictation',
};

const SLUG_TO_DESC: Record<string, string> = {
  'summarise-spoken': 'Listen to audio and write a summary.',
  'mcq-multiple': 'Listen and select ALL correct answers.',
  'fill-blanks': 'Listen and type missing words into the transcript.',
  'highlight-correct-summary': 'Listen and select which summary best matches.',
  'mcq-single': 'Listen and select ONE correct answer.',
  'select-missing-word': 'Listen and select the word that completes the audio.',
  'highlight-incorrect-words': 'Listen and click words in the transcript that differ from the audio.',
  'write-dictation': 'Listen and type exactly what you hear.',
};

const SLUG_TO_PREVIEW: Record<string, string> = {
  'summarise-spoken': 'Audio + written summary task',
  'fill-blanks': 'Audio + fill blank transcript',
  'highlight-correct-summary': 'Audio + select correct summary',
  'select-missing-word': 'Audio ends with beep — select missing word',
  'highlight-incorrect-words': 'Audio + click incorrect words in transcript',
  'write-dictation': 'Audio + type exactly what you hear',
};

interface Props {
  slug: string;
}

export default function ListeningTypeContent({ slug }: Props) {
  const apiType = SLUG_TO_TYPE[slug] ?? slug;
  const typeName = SLUG_TO_NAME[slug] ?? slug;
  const typeDesc = SLUG_TO_DESC[slug] ?? '';
  const { data, isLoading, isError, refetch } = useListeningList(apiType);

  if (isLoading) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Listening', href: ROUTES.student.listening.home }, { label: typeName }]} />
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
  const defaultPreview = SLUG_TO_PREVIEW[slug];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Listening', href: ROUTES.student.listening.home }, { label: typeName }]} />

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
          icon={Headphones}
          title="No questions available"
          description="Your instructor has not added any questions yet."
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, index) => (
            <Link
              key={q.id}
              href={ROUTES.student.listening.question(slug, q.id)}
              className="group flex items-center gap-3 rounded-card border border-border-default bg-bg-card p-4 shadow-card transition-all hover:border-action-default hover:shadow-hover sm:gap-4"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-input bg-bg-page text-label-lg text-text-secondary sm:size-10">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md text-text-primary">
                  {q.preview ? `${q.preview}...` : defaultPreview ?? `${typeName} Question ${index + 1}`}
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
