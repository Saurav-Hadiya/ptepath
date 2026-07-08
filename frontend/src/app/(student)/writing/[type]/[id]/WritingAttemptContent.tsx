'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Breadcrumb from '@/components/shared/Breadcrumb';
import ScoreBreakdownCard from '@/components/shared/ScoreBreakdownCard';
import EmptyState from '@/components/shared/EmptyState';
import SummariseWrittenTextQuestion from '@/components/writing/SummariseWrittenTextQuestion';
import WriteEssayQuestion from '@/components/writing/WriteEssayQuestion';
import { useWritingQuestion } from '@/hooks/queries/useWritingQueries';
import { ROUTES } from '@/config/routes';
import type { WritingScoreResult } from '@/types';

const SLUG_TO_TYPE: Record<string, string> = {
  'summarise-written-text': 'summarise_written_text',
  'write-essay': 'write_essay',
};

const SLUG_TO_NAME: Record<string, string> = {
  'summarise-written-text': 'Summarise Written Text',
  'write-essay': 'Write Essay',
};

const INFO_ROWS: Record<string, Array<{ label: string; value: string }>> = {
  summarise_written_text: [
    { label: 'Type', value: 'Summarise Written Text' },
    { label: 'Time limit', value: '10 minutes' },
    { label: 'Word range', value: '5 – 75 words' },
    { label: 'Sentences', value: 'Exactly one sentence' },
  ],
  write_essay: [
    { label: 'Type', value: 'Write Essay' },
    { label: 'Time limit', value: '20 minutes' },
    { label: 'Word range', value: '200 – 300 words' },
    { label: 'Target', value: 'Well-structured essay' },
  ],
};

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

  const { data: question, isLoading, isError, refetch } = useWritingQuestion(apiType, id);

  const handleScoreReceived = useCallback((result: WritingScoreResult) => {
    setScore(result);
  }, []);

  const handleNext = useCallback(() => {
    router.push(ROUTES.student.writing.type(slug));
  }, [router, slug]);

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

  const infoRows = INFO_ROWS[apiType] ?? [];

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
            <WriteEssayQuestion question={question} onScoreReceived={handleScoreReceived} />
          ) : (
            <SummariseWrittenTextQuestion question={question} onScoreReceived={handleScoreReceived} />
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
                onNext={handleNext}
                nextLabel="Try Another Question"
              />
              {score.misspelledWords.length > 0 && (
                <div className="rounded-card border border-border-default bg-bg-card p-4 shadow-card">
                  <p className="mb-2 text-label-sm font-semibold text-text-secondary">Spelling errors found:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {score.misspelledWords.slice(0, 5).map((word) => (
                      <Badge
                        key={word}
                        className="rounded-pill border-none bg-feedback-error-bg px-2.5 py-0.5 text-label-sm text-feedback-error"
                      >
                        {word}
                      </Badge>
                    ))}
                    {score.misspelledWords.length > 5 && (
                      <Badge className="rounded-pill border-none bg-bg-page px-2.5 py-0.5 text-label-sm text-text-muted">
                        +{score.misspelledWords.length - 5} more
                      </Badge>
                    )}
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
