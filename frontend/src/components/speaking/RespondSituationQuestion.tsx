'use client';

import { useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import QuestionTypeBadge from '@/components/shared/QuestionTypeBadge';
import RecordButton from '@/components/shared/RecordButton';
import MicDeniedError from '@/components/speaking/MicDeniedError';
import { Button } from '@/components/ui/button';
import { useSpeakingAttempt } from '@/hooks/useSpeakingAttempt';
import { speakingService } from '@/services/speaking.service';
import type { SpeakingQuestion, SpeakingScoreResult } from '@/types';

interface Props {
  question: SpeakingQuestion;
  onScoreReceived: (score: SpeakingScoreResult) => void;
}

export default function RespondSituationQuestion({ question, onScoreReceived }: Props) {
  const {
    phase,
    submitError,
    micError,
    retrySubmit,
    prepSecondsLeft,
    speakSecondsLeft,
    skipPreparation,
    submitNow,
    score,
  } = useSpeakingAttempt({
    preparationTime: question.preparationTime,
    speakingTime: question.speakingTime,
    onSubmit: (blob, duration) => speakingService.evaluateRespondSituation(question.id, blob, duration),
  });

  useEffect(() => {
    if (score) onScoreReceived(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  if (micError) return <MicDeniedError />;

  return (
    <div className="space-y-5">
      <QuestionTypeBadge type="respond_situation" module="speaking" />

      <p className="text-body-md text-text-secondary">
        Read the situation below and respond as you would in real life.
      </p>

      <div className="max-h-[50vh] overflow-y-auto rounded-card border border-border-default bg-bg-page p-4 sm:p-5">
        <p className="whitespace-pre-wrap text-body-lg leading-[1.8] text-text-primary">
          {question.content}
        </p>
      </div>

      {submitError ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-feedback-error/20 bg-feedback-error-bg p-5 text-center">
          <AlertCircle className="size-6 text-feedback-error" />
          <p className="text-body-sm text-feedback-error-text">{submitError}</p>
          <Button onClick={retrySubmit} className="bg-action-default text-primary-foreground hover:bg-action-hover">
            Try Again
          </Button>
        </div>
      ) : phase === 'scored' ? (
        <div className="flex items-center justify-center gap-2 rounded-card border border-feedback-success/20 bg-feedback-success-bg p-5 text-center">
          <CheckCircle2 className="size-5 text-feedback-success" />
          <span className="text-body-sm font-medium text-feedback-success-text">
            Response submitted — see your score
          </span>
        </div>
      ) : (
        <RecordButton
          state={phase === 'listening' ? 'processing' : phase}
          onStop={submitNow}
          onSkip={skipPreparation}
          countdown={phase === 'preparing' ? prepSecondsLeft : speakSecondsLeft}
        />
      )}
    </div>
  );
}
