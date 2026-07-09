'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import AudioPlayer, { AudioPlayerHandle } from '@/components/shared/AudioPlayer';
import MCQOption from '@/components/shared/MCQOption';
import { Button } from '@/components/ui/button';
import { useSubmitListening } from '@/hooks/queries/useListeningQueries';
import type { ListeningQuestion, ListeningScoreResult, MCQSingleBreakdown } from '@/types';

interface Props {
  question: ListeningQuestion;
  onScoreReceived: (score: ListeningScoreResult) => void;
}

export default function MCQSingleListeningQuestion({ question, onScoreReceived }: Props) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<MCQSingleBreakdown | null>(null);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const mutation = useSubmitListening();

  const handleSubmit = () => {
    if (!selectedLabel || submitted) return;
    audioPlayerRef.current?.pause();
    mutation.mutate(
      { questionId: question.id, questionType: 'mcq_single', answer: selectedLabel },
      {
        onSuccess: (result) => {
          setBreakdown(result.breakdown as MCQSingleBreakdown);
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
      <p className="text-body-md text-text-secondary">Listen to the audio. Select ONE correct answer.</p>

      <AudioPlayer ref={audioPlayerRef} audioUrl={question.audioUrl} playLimit={question.playLimit} />

      {question.question && <p className="text-body-md font-medium text-text-primary">{question.question}</p>}

      <div className="space-y-2">
        {options.map((opt) => {
          const optionResult = breakdown?.optionResults.find((o) => o.label === opt.label);
          let resultState: 'correct' | 'wrong' | 'neutral' | undefined;
          if (optionResult) {
            resultState = optionResult.isCorrect ? 'correct' : optionResult.selected ? 'wrong' : 'neutral';
          }
          return (
            <MCQOption
              key={opt.label}
              label={opt.label}
              text={opt.text}
              selected={optionResult ? optionResult.selected : selectedLabel === opt.label}
              disabled={submitted}
              resultState={resultState}
              multiSelect={false}
              onChange={(label) => !submitted && setSelectedLabel(label)}
            />
          );
        })}
      </div>

      {!submitted && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedLabel || mutation.isPending}
          className="w-full gap-1.5 bg-action-default text-primary-foreground hover:bg-action-hover sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Checking your answer...' : 'Submit Answer'}
        </Button>
      )}
    </div>
  );
}
