'use client';

import { useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import QuestionTypeBadge from '@/components/shared/QuestionTypeBadge';
import RecordButton from '@/components/shared/RecordButton';
import PlayAudioPrompt from '@/components/speaking/PlayAudioPrompt';
import MicDeniedError from '@/components/speaking/MicDeniedError';
import { Button } from '@/components/ui/button';
import { useSpeakingAttempt } from '@/hooks/useSpeakingAttempt';
import { speakingService } from '@/services/speaking.service';
import type { SpeakingQuestion, SpeakingScoreResult } from '@/types';

interface Props {
  question: SpeakingQuestion;
  onScoreReceived: (score: SpeakingScoreResult) => void;
  /** Shown once scored — override for contexts (e.g. mock test) where "see your score" doesn't apply yet. */
  completionMessage?: string;
  /** Whether to reveal the correct sentence immediately after scoring — false in a mock test, where answers are only revealed at the end. */
  revealAnswer?: boolean;
}

export default function RepeatSentenceQuestion({
  question,
  onScoreReceived,
  completionMessage = 'Response submitted — see your score',
  revealAnswer = true,
}: Props) {
  const {
    phase,
    isPlayingAudio,
    hasPlayedAudio,
    audioSupported,
    playAudio,
    submitError,
    micError,
    retrySubmit,
    speakSecondsLeft,
    submitNow,
    score,
  } = useSpeakingAttempt({
    preparationTime: 0,
    speakingTime: question.speakingTime || 15,
    ttsText: question.content,
    onSubmit: (blob) => speakingService.evaluateRepeatSentence(question.id, blob),
  });

  useEffect(() => {
    if (score) onScoreReceived(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  if (micError) return <MicDeniedError />;

  return (
    <div className="space-y-5">
      <QuestionTypeBadge type="repeat_sentence" module="speaking" />

      <p className="text-body-md text-text-secondary">
        Listen to a sentence and repeat it exactly as you heard it.
      </p>

      {phase === 'listening' && (
        <PlayAudioPrompt
          instruction="Tap to listen, then repeat the sentence exactly."
          isPlaying={isPlayingAudio}
          hasPlayed={hasPlayedAudio}
          audioSupported={audioSupported}
          onPlay={playAudio}
        />
      )}

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
          <span className="text-body-sm font-medium text-feedback-success-text">{completionMessage}</span>
        </div>
      ) : (
        phase !== 'listening' && (
          <RecordButton state={phase} onStop={submitNow} countdown={speakSecondsLeft} />
        )
      )}

      {revealAnswer && phase === 'scored' && (
        <div className="rounded-card border border-action-default/20 bg-action-subtle p-4">
          <span className="text-label-sm text-text-secondary">The sentence was:</span>
          <p className="mt-1 text-body-md text-text-primary">&ldquo;{question.content}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
