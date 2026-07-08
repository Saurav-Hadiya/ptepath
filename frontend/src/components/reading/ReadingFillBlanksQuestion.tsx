'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AnswerResult from '@/components/shared/AnswerResult';
import { useSubmitReading } from '@/hooks/queries/useReadingQueries';
import type { ReadingQuestion, ReadingScoreResult, FillBlanksBreakdown } from '@/types';

interface Props {
  question: ReadingQuestion;
  onScoreReceived: (score: ReadingScoreResult) => void;
}

export default function ReadingFillBlanksQuestion({ question, onScoreReceived }: Props) {
  const blanks = question.blanks ?? [];
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<FillBlanksBreakdown | null>(null);
  const mutation = useSubmitReading();

  const allAnswered = blanks.length > 0 && blanks.every((_, i) => !!selections[i]);

  const handleSubmit = () => {
    if (!allAnswered || submitted) return;
    const answers = blanks.map((_, i) => selections[i]);
    mutation.mutate(
      { questionId: question.id, questionType: 'reading_fill_blanks', answers },
      {
        onSuccess: (result) => {
          setBreakdown(result.breakdown as FillBlanksBreakdown);
          setSubmitted(true);
          onScoreReceived(result);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  };

  const segments = question.passage.split('[BLANK]');

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Read the passage. Select the correct word from each dropdown.
      </p>

      <div className="rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
        <p className="whitespace-pre-wrap text-body-md leading-[2.4] text-text-primary">
          {segments.map((segment, i) => (
            <span key={i}>
              {segment}
              {i < blanks.length && (
                <span className="mx-1 inline-block align-middle">
                  <Select
                    value={selections[i] ?? ''}
                    onValueChange={(value) => {
                      if (value) setSelections((prev) => ({ ...prev, [i]: value }));
                    }}
                    disabled={submitted}
                  >
                    <SelectTrigger
                      className={`h-8 min-w-32 ${
                        breakdown
                          ? breakdown.breakdown[i]?.correct
                            ? 'border-feedback-success bg-feedback-success-bg'
                            : 'border-feedback-error bg-feedback-error-bg'
                          : ''
                      }`}
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {blanks[i].options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {breakdown && (
        <div className="space-y-2">
          {breakdown.breakdown.map((b) => (
            <AnswerResult key={b.blank} state={b.correct ? 'correct' : 'wrong'}>
              Blank {b.blank}: {b.correct ? `"${b.studentAnswer}" is correct.` : `You chose "${b.studentAnswer || '(none)'}" — correct answer: "${b.correctAnswer}"`}
            </AnswerResult>
          ))}
        </div>
      )}

      {!submitted && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your answers...' : 'Submit Answers'}
        </Button>
      )}
    </div>
  );
}
