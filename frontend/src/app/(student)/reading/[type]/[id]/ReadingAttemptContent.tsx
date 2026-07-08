'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumb from '@/components/shared/Breadcrumb';
import ScoreBreakdownCard from '@/components/shared/ScoreBreakdownCard';
import EmptyState from '@/components/shared/EmptyState';
import RWFillBlanksQuestion from '@/components/reading/RWFillBlanksQuestion';
import MCQMultipleQuestion from '@/components/reading/MCQMultipleQuestion';
import ReorderParagraphsQuestion from '@/components/reading/ReorderParagraphsQuestion';
import ReadingFillBlanksQuestion from '@/components/reading/ReadingFillBlanksQuestion';
import MCQSingleQuestion from '@/components/reading/MCQSingleQuestion';
import { useReadingQuestion, useReadingNext } from '@/hooks/queries/useReadingQueries';
import { ROUTES } from '@/config/routes';
import type {
  FillBlanksBreakdown,
  MCQMultipleBreakdown,
  ReorderBreakdown,
  ReadingQuestionType,
  ReadingScoreResult,
} from '@/types';

const SLUG_TO_TYPE: Record<string, ReadingQuestionType> = {
  'rw-fill-blanks': 'rw_fill_blanks',
  'mcq-multiple': 'mcq_multiple',
  'reorder-paragraphs': 'reorder_paragraphs',
  'reading-fill-blanks': 'reading_fill_blanks',
  'mcq-single': 'mcq_single',
};

const SLUG_TO_NAME: Record<string, string> = {
  'rw-fill-blanks': 'R&W Fill in the Blanks',
  'mcq-multiple': 'MCQ Multiple Answers',
  'reorder-paragraphs': 'Re-order Paragraphs',
  'reading-fill-blanks': 'Reading Fill in the Blanks',
  'mcq-single': 'MCQ Single Answer',
};

const SCORING_DESC: Record<string, string> = {
  rw_fill_blanks: '1 point per correct blank',
  mcq_multiple: '+1 / −1 per option',
  reorder_paragraphs: 'Pair-based scoring',
  reading_fill_blanks: '1 point per correct blank',
  mcq_single: 'Binary — correct or wrong',
};

function getScoreBars(apiType: string, score: ReadingScoreResult) {
  if (apiType === 'mcq_single') return [];
  if (apiType === 'reorder_paragraphs') return [{ label: 'Order Accuracy', score: score.finalScore }];
  return [{ label: 'Accuracy', score: score.finalScore }];
}

interface Props {
  slug: string;
  id: string;
}

export default function ReadingAttemptContent({ slug, id }: Props) {
  const router = useRouter();
  const apiType = SLUG_TO_TYPE[slug] ?? slug;
  const typeName = SLUG_TO_NAME[slug] ?? slug;
  const [score, setScore] = useState<ReadingScoreResult | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);

  const { data: question, isLoading, isError, refetch } = useReadingQuestion(apiType, id);
  const nextMutation = useReadingNext();

  const handleScoreReceived = useCallback((result: ReadingScoreResult) => {
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
          router.push(ROUTES.student.reading.question(slug, next.id));
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
            { label: 'Reading', href: ROUTES.student.reading.home },
            { label: typeName, href: ROUTES.student.reading.type(slug) },
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

  let extraInfo: string | null = null;
  if (score) {
    if (apiType === 'mcq_multiple') {
      const b = score.breakdown as MCQMultipleBreakdown;
      extraInfo = `${b.totalPoints} points from ${b.numberOfCorrect} correct option${b.numberOfCorrect === 1 ? '' : 's'}`;
    } else if (apiType === 'reorder_paragraphs') {
      const b = score.breakdown as ReorderBreakdown;
      extraInfo = `${b.correctPairs} / ${b.totalPairs} pairs in correct order`;
    } else if (apiType === 'rw_fill_blanks' || apiType === 'reading_fill_blanks') {
      const b = score.breakdown as FillBlanksBreakdown;
      extraInfo = `${b.correctCount} / ${b.totalBlanks} blanks correct`;
    }
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Reading', href: ROUTES.student.reading.home },
          { label: typeName, href: ROUTES.student.reading.type(slug) },
          { label: 'Question' },
        ]}
      />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left panel — question content */}
        <div>
          {apiType === 'rw_fill_blanks' && (
            <RWFillBlanksQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
          )}
          {apiType === 'mcq_multiple' && (
            <MCQMultipleQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
          )}
          {apiType === 'reorder_paragraphs' && (
            <ReorderParagraphsQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
          )}
          {apiType === 'reading_fill_blanks' && (
            <ReadingFillBlanksQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
          )}
          {apiType === 'mcq_single' && (
            <MCQSingleQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
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
                bars={getScoreBars(apiType, score)}
                feedback={score.feedback}
                onRetry={handleRetry}
                retryLabel="Retry"
                onNext={handleNext}
                nextLabel="Next"
                nextDisabled={nextMutation.isPending}
              />
              {extraInfo && (
                <div className="rounded-card border border-border-default bg-bg-card p-3 text-body-sm text-text-secondary shadow-card">
                  {extraInfo}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-card border border-border-default bg-bg-page p-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-label-sm">
                  <span className="text-text-secondary">Type</span>
                  <span className="font-medium text-text-primary">{typeName}</span>
                </div>
                <div className="flex items-center justify-between text-label-sm">
                  <span className="text-text-secondary">Module</span>
                  <span className="font-medium text-text-primary">Reading</span>
                </div>
                <div className="flex items-center justify-between text-label-sm">
                  <span className="text-text-secondary">Scoring</span>
                  <span className="font-medium text-text-primary">{SCORING_DESC[apiType] ?? ''}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
