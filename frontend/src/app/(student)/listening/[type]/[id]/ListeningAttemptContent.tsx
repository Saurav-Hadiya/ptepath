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
import SummariseSpokenQuestion from '@/components/listening/SummariseSpokenQuestion';
import MCQMultipleListeningQuestion from '@/components/listening/MCQMultipleListeningQuestion';
import FillBlanksListeningQuestion from '@/components/listening/FillBlanksListeningQuestion';
import HighlightSummaryQuestion from '@/components/listening/HighlightSummaryQuestion';
import MCQSingleListeningQuestion from '@/components/listening/MCQSingleListeningQuestion';
import SelectMissingWordQuestion from '@/components/listening/SelectMissingWordQuestion';
import HighlightIncorrectWordsQuestion from '@/components/listening/HighlightIncorrectWordsQuestion';
import WriteDictationQuestion from '@/components/listening/WriteDictationQuestion';
import { useListeningQuestion, useListeningNext } from '@/hooks/queries/useListeningQueries';
import { ROUTES } from '@/config/routes';
import type {
  FillBlanksListeningBreakdown,
  HighlightIncorrectBreakdown,
  MCQMultipleBreakdown,
  ListeningQuestionType,
  ListeningScoreResult,
  WriteDictationBreakdown,
} from '@/types';

const SLUG_TO_TYPE: Record<string, ListeningQuestionType> = {
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

const SCORING_DESC: Record<string, string> = {
  summarise_spoken: 'Word count + spelling',
  mcq_multiple: '+1 / −1 per option',
  fill_blanks: 'Fuzzy match — partial credit per blank',
  highlight_summary: 'Binary — correct or wrong',
  mcq_single: 'Binary — correct or wrong',
  select_missing: 'Binary — correct or wrong',
  highlight_incorrect: '+1 / −1 per word',
  write_dictation: 'Word match + spelling',
};

const NO_BAR_TYPES = new Set(['highlight_summary', 'mcq_single', 'select_missing']);

function getScoreBars(apiType: string, score: ListeningScoreResult) {
  if (NO_BAR_TYPES.has(apiType)) return [];
  if (apiType === 'summarise_spoken') {
    const b = score.breakdown as { wordCountScore: number; spellingScore: number };
    return [
      { label: 'Word Count', score: b.wordCountScore },
      { label: 'Spelling', score: b.spellingScore },
    ];
  }
  if (apiType === 'write_dictation') {
    const b = score.breakdown as WriteDictationBreakdown;
    return [
      { label: 'Word Match', score: b.wordMatchScore },
      { label: 'Spelling', score: b.spellingScore },
    ];
  }
  return [{ label: 'Accuracy', score: score.finalScore }];
}

interface Props {
  slug: string;
  id: string;
}

export default function ListeningAttemptContent({ slug, id }: Props) {
  const router = useRouter();
  const apiType = SLUG_TO_TYPE[slug] ?? slug;
  const typeName = SLUG_TO_NAME[slug] ?? slug;
  const [score, setScore] = useState<ListeningScoreResult | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);

  const { data: question, isLoading, isError, refetch } = useListeningQuestion(apiType, id);
  const nextMutation = useListeningNext();

  const handleScoreReceived = useCallback((result: ListeningScoreResult) => {
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
          router.push(ROUTES.student.listening.question(slug, next.id));
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
            { label: 'Listening', href: ROUTES.student.listening.home },
            { label: typeName, href: ROUTES.student.listening.type(slug) },
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
    } else if (apiType === 'fill_blanks') {
      const b = score.breakdown as FillBlanksListeningBreakdown;
      extraInfo = `${b.totalPoints} / ${b.totalBlanks} points`;
    } else if (apiType === 'highlight_incorrect') {
      const b = score.breakdown as HighlightIncorrectBreakdown;
      const found = b.wordResults.filter((w) => w.result === 'correct_click').length;
      extraInfo = `${found} of ${b.totalIncorrect} incorrect words found`;
    } else if (apiType === 'write_dictation') {
      const b = score.breakdown as WriteDictationBreakdown;
      extraInfo = `${b.matchedWords} / ${b.totalWords} words matched`;
    }
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Listening', href: ROUTES.student.listening.home },
          { label: typeName, href: ROUTES.student.listening.type(slug) },
          { label: 'Question' },
        ]}
      />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left panel — question content */}
        <div>
          {apiType === 'summarise_spoken' && (
            <SummariseSpokenQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
          )}
          {apiType === 'mcq_multiple' && (
            <MCQMultipleListeningQuestion
              key={attemptKey}
              question={question}
              onScoreReceived={handleScoreReceived}
            />
          )}
          {apiType === 'fill_blanks' && (
            <FillBlanksListeningQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
          )}
          {apiType === 'highlight_summary' && (
            <HighlightSummaryQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
          )}
          {apiType === 'mcq_single' && (
            <MCQSingleListeningQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
          )}
          {apiType === 'select_missing' && (
            <SelectMissingWordQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
          )}
          {apiType === 'highlight_incorrect' && (
            <HighlightIncorrectWordsQuestion
              key={attemptKey}
              question={question}
              onScoreReceived={handleScoreReceived}
            />
          )}
          {apiType === 'write_dictation' && (
            <WriteDictationQuestion key={attemptKey} question={question} onScoreReceived={handleScoreReceived} />
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
              <div className="space-y-2">
                <div className="flex flex-col gap-0.5 text-label-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                  <span className="shrink-0 text-text-secondary">Type</span>
                  <span className="font-medium text-text-primary sm:text-right">{typeName}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-label-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                  <span className="shrink-0 text-text-secondary">Module</span>
                  <span className="font-medium text-text-primary sm:text-right">Listening</span>
                </div>
                <div className="flex flex-col gap-0.5 text-label-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                  <span className="shrink-0 text-text-secondary">Scoring</span>
                  <span className="font-medium text-text-primary sm:text-right">
                    {SCORING_DESC[apiType] ?? ''}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-label-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                  <span className="shrink-0 text-text-secondary">Play limit</span>
                  <span className="font-medium text-text-primary sm:text-right">
                    {question.playLimit === 0 ? 'Unlimited' : 'Once'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
