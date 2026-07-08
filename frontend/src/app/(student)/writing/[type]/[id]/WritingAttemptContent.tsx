'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Breadcrumb from '@/components/shared/Breadcrumb';
import ScoreBreakdownCard from '@/components/shared/ScoreBreakdownCard';
import EmptyState from '@/components/shared/EmptyState';
import SummariseWrittenTextQuestion from '@/components/writing/SummariseWrittenTextQuestion';
import WriteEssayQuestion from '@/components/writing/WriteEssayQuestion';
import { useWritingQuestion, useWritingNext } from '@/hooks/queries/useWritingQueries';
import { ROUTES } from '@/config/routes';
import { formatDuration } from '@/lib/duration';
import type { WritingQuestion, WritingScoreResult } from '@/types';

const SLUG_TO_TYPE: Record<string, string> = {
  'summarise-written-text': 'summarise_written_text',
  'write-essay': 'write_essay',
};

const SLUG_TO_NAME: Record<string, string> = {
  'summarise-written-text': 'Summarise Written Text',
  'write-essay': 'Write Essay',
};

/** Time limit and word range come from the question itself — admins can override
 *  the per-type defaults, so these must never be hardcoded. */
function getInfoRows(apiType: string, question: WritingQuestion): Array<{ label: string; value: string }> {
  const timeLimit = formatDuration(question.timeLimit);
  const wordRange = `${question.wordMin} – ${question.wordMax} words`;

  if (apiType === 'write_essay') {
    return [
      { label: 'Type', value: 'Write Essay' },
      { label: 'Time limit', value: timeLimit },
      { label: 'Word range', value: wordRange },
      { label: 'Target', value: 'Well-structured essay' },
    ];
  }

  return [
    { label: 'Type', value: 'Summarise Written Text' },
    { label: 'Time limit', value: timeLimit },
    { label: 'Word range', value: wordRange },
    { label: 'Sentences', value: 'Exactly one sentence' },
  ];
}

function getScoreBars(score: WritingScoreResult) {
  return [
    { label: 'Word Count', score: score.wordCountScore },
    { label: 'Spelling', score: score.spellingScore },
  ];
}

interface Props {
  slug: string;
  id: string;
}

export default function WritingAttemptContent({ slug, id }: Props) {
  const router = useRouter();
  const apiType = SLUG_TO_TYPE[slug] ?? slug;
  const typeName = SLUG_TO_NAME[slug] ?? slug;
  const [score, setScore] = useState<WritingScoreResult | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);

  const { data: question, isLoading, isError, refetch } = useWritingQuestion(apiType, id);
  const nextMutation = useWritingNext();

  const handleScoreReceived = useCallback((result: WritingScoreResult) => {
    setScore(result);
  }, []);

  const handleRetry = useCallback(() => {
    setScore(null);
    setAttemptKey((k) => k + 1);
  }, []);

  const handleNext = useCallback(() => {
    nextMutation.mutate(
      { type: apiType, id },
      {
        onSuccess: (next) => {
          router.push(ROUTES.student.writing.question(slug, next.id));
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }, [nextMutation, apiType, id, router, slug]);

  if (isLoading) {
    return (
      <div>
        <Breadcrumb
          items={[
            { label: 'Writing', href: ROUTES.student.writing.home },
            { label: typeName, href: ROUTES.student.writing.type(slug) },
            { label: 'Question' },
          ]}
        />
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <Skeleton className="h-100 rounded-card" />
          <Skeleton className="h-75 rounded-card" />
        </div>
      </div>
    );
  }

  if (isError || !question) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={AlertTriangle}
          title="Question not found"
          description="This question may have been removed or is unavailable."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    );
  }

  const infoRows = getInfoRows(apiType, question);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Writing', href: ROUTES.student.writing.home },
          { label: typeName, href: ROUTES.student.writing.type(slug) },
          { label: 'Question' },
        ]}
      />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left panel — question content + writing area */}
        <div>
          {apiType === 'write_essay' ? (
            <WriteEssayQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
          ) : (
            <SummariseWrittenTextQuestion
              key={attemptKey}
              question={question}
              onScoreReceived={handleScoreReceived}
            />
          )}
        </div>

        {/* Right panel — info facts until scored, then the score breakdown */}
        <div className="space-y-4">
          {score ? (
            <>
              <ScoreBreakdownCard
                title="Your Score"
                displayScore={score.displayScore}
                finalScore={score.finalScore}
                bars={getScoreBars(score)}
                feedback={score.feedback}
                onRetry={handleRetry}
                retryLabel="Retry"
                onNext={handleNext}
                nextLabel="Next"
                nextDisabled={nextMutation.isPending}
              />
              <div className="rounded-card border border-border-default bg-bg-card p-3 text-body-sm text-text-secondary shadow-card">
                <p>
                  Word count: {score.breakdown.wordCount.actual} (required: {score.breakdown.wordCount.min}–
                  {score.breakdown.wordCount.max})
                </p>
                <p className="mt-1">
                  Spelling: {score.breakdown.spelling.correct} / {score.breakdown.spelling.total} words correct
                </p>
              </div>
              {score.misspelledWords.length > 0 && (
                <div className="rounded-card border border-border-default bg-bg-card p-4 shadow-card">
                  <p className="mb-2 text-label-sm font-semibold text-text-secondary">
                    Spelling errors found ({score.misspelledWords.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {score.misspelledWords.map((word) => (
                      <Badge
                        key={word}
                        className="rounded-pill border-none bg-feedback-error-bg px-2.5 py-0.5 text-label-sm text-feedback-error"
                      >
                        {word}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-label-sm text-text-muted">Check your spelling of these words.</p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-card border border-border-default bg-bg-page p-3">
              <div className="space-y-1.5">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-label-sm">
                    <span className="text-text-secondary">{row.label}</span>
                    <span className="font-medium text-text-primary">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
