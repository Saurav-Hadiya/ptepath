'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumb from '@/components/shared/Breadcrumb';
import ScoreBreakdownCard from '@/components/shared/ScoreBreakdownCard';
import EmptyState from '@/components/shared/EmptyState';
import ReadAloudQuestion from '@/components/speaking/ReadAloudQuestion';
import RepeatSentenceQuestion from '@/components/speaking/RepeatSentenceQuestion';
import DescribeImageQuestion from '@/components/speaking/DescribeImageQuestion';
import RespondSituationQuestion from '@/components/speaking/RespondSituationQuestion';
import AnswerShortQuestion from '@/components/speaking/AnswerShortQuestion';
import { useSpeakingQuestion, useSpeakingNext } from '@/hooks/queries/useSpeakingQueries';
import { ROUTES } from '@/config/routes';
import { formatDuration } from '@/lib/duration';
import type { SpeakingScoreResult } from '@/types';

const SLUG_TO_TYPE: Record<string, string> = {
  'read-aloud': 'read_aloud',
  'repeat-sentence': 'repeat_sentence',
  'describe-image': 'describe_image',
  'respond-situation': 'respond_situation',
  'answer-short-question': 'answer_short',
};

const SLUG_TO_NAME: Record<string, string> = {
  'read-aloud': 'Read Aloud',
  'repeat-sentence': 'Repeat Sentence',
  'describe-image': 'Describe Image',
  'respond-situation': 'Respond to Situation',
  'answer-short-question': 'Answer Short Question',
};

function getScoreBars(type: string, score: SpeakingScoreResult) {
  switch (type) {
    case 'read_aloud':
    case 'repeat_sentence':
      return [
        { label: 'Content', score: score.contentScore ?? 0 },
        { label: 'Fluency', score: score.fluencyScore ?? 0 },
        { label: 'Pronunciation', score: score.pronunciationScore ?? 0 },
      ];
    case 'describe_image':
    case 'respond_situation':
      return [
        { label: 'Fluency', score: score.fluencyScore ?? 0 },
        { label: 'Pronunciation', score: score.pronunciationScore ?? 0 },
        { label: 'Engagement', score: score.engagementScore ?? 0 },
      ];
    case 'answer_short':
      return [
        { label: 'Content', score: score.contentScore ?? 0 },
        { label: 'Pronunciation', score: score.pronunciationScore ?? 0 },
      ];
    default:
      return [];
  }
}

interface Props {
  slug: string;
  id: string;
}

export default function SpeakingAttemptContent({ slug, id }: Props) {
  const router = useRouter();
  const apiType = SLUG_TO_TYPE[slug] ?? slug;
  const typeName = SLUG_TO_NAME[slug] ?? slug;
  const [score, setScore] = useState<SpeakingScoreResult | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);

  const { data: question, isLoading, isError, refetch } = useSpeakingQuestion(apiType, id);
  const nextMutation = useSpeakingNext();

  const handleScoreReceived = useCallback((result: SpeakingScoreResult) => {
    setScore(result);
  }, []);

  const handleRetry = useCallback(() => {
    setScore(null);
    setAttemptKey((key) => key + 1);
  }, []);

  const handleNext = useCallback(() => {
    nextMutation.mutate(
      { type: apiType, id },
      {
        onSuccess: (next) => {
          router.push(ROUTES.student.speaking.question(slug, next.id));
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
            { label: 'Speaking', href: ROUTES.student.speaking.home },
            { label: typeName, href: ROUTES.student.speaking.type(slug) },
            { label: 'Question' },
          ]}
        />
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
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

  const QuestionComponent = {
    read_aloud: ReadAloudQuestion,
    repeat_sentence: RepeatSentenceQuestion,
    describe_image: DescribeImageQuestion,
    respond_situation: RespondSituationQuestion,
    answer_short: AnswerShortQuestion,
  }[apiType];

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Speaking', href: ROUTES.student.speaking.home },
          { label: typeName, href: ROUTES.student.speaking.type(slug) },
          { label: 'Question' },
        ]}
      />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left panel — question content */}
        <div>
          {QuestionComponent && (
            <QuestionComponent
              key={`${question.id}-${attemptKey}`}
              question={question}
              onScoreReceived={handleScoreReceived}
            />
          )}
        </div>

        {/* Right panel — score takes priority once available; question facts are
            secondary and are dropped once the result is in so they don't compete
            for attention with the score. */}
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
              {score.wpm !== null && (
                <div className="rounded-card border border-border-default bg-bg-card p-3 text-body-sm text-text-secondary shadow-card">
                  Speaking pace: {score.wpm} words per minute
                </div>
              )}
            </>
          ) : (
            <div className="rounded-card border border-border-default bg-bg-page p-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label-sm text-text-secondary">
                <span>{typeName}</span>
                <span>Speaking: {formatDuration(question.speakingTime)}</span>
                {question.preparationTime > 0 && <span>Prep: {formatDuration(question.preparationTime)}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
