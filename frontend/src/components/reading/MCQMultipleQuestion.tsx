'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, TriangleAlert } from 'lucide-react';
import MCQOption from '@/components/shared/MCQOption';
import { Button } from '@/components/ui/button';
import { useSubmitReading } from '@/hooks/queries/useReadingQueries';
import type { ReadingQuestion, ReadingScoreResult, MCQMultipleBreakdown, MCQResultState } from '@/types';

interface Props {
  question: ReadingQuestion;
  onScoreReceived: (score: ReadingScoreResult) => void;
}

const RESULT_MAP: Record<MCQResultState, 'correct' | 'wrong' | 'missed' | 'neutral'> = {
  correct_selected: 'correct',
  wrong_selected: 'wrong',
  missed: 'missed',
  neutral: 'neutral',
};

export default function MCQMultipleQuestion({ question, onScoreReceived }: Props) {
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<MCQMultipleBreakdown | null>(null);
  const mutation = useSubmitReading();

  const toggleLabel = (label: string) => {
    if (submitted) return;
    setSelectedLabels((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  };

  const handleSubmit = () => {
    if (selectedLabels.length === 0 || submitted) return;
    mutation.mutate(
      { questionId: question.id, questionType: 'mcq_multiple', answers: selectedLabels },
      {
        onSuccess: (result) => {
          setBreakdown(result.breakdown as MCQMultipleBreakdown);
          setSubmitted(true);
          onScoreReceived(result);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  };

  const options = question.options ?? [];

  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary">
        Read the passage. Select ALL correct answers. More than one option may be correct. Negative marking applies.
      </p>

      <div className="max-h-[180px] overflow-y-auto rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
        <p className="whitespace-pre-wrap text-body-md leading-[1.8] text-text-primary">{question.passage}</p>
      </div>

      {question.question && <p className="text-body-md font-medium text-text-primary">{question.question}</p>}

      <div className="space-y-2">
        {options.map((opt) => {
          const optionResult = breakdown?.optionResults.find((o) => o.label === opt.label);
          return (
            <MCQOption
              key={opt.label}
              label={opt.label}
              text={opt.text}
              selected={optionResult ? optionResult.selected : selectedLabels.includes(opt.label)}
              disabled={submitted}
              resultState={optionResult ? RESULT_MAP[optionResult.result] : undefined}
              multiSelect
              onChange={toggleLabel}
            />
          );
        })}
      </div>

      {!submitted && (
        <div className="flex items-start gap-2.5 rounded-input border border-feedback-warning/30 bg-feedback-warning-bg p-3 text-body-sm text-feedback-warning-text">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>Selecting a wrong option deducts points. Only select options you are confident about.</span>
        </div>
      )}

      {!submitted && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={selectedLabels.length === 0 || mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your answers...' : 'Submit Answers'}
        </Button>
      )}
    </div>
  );
}
