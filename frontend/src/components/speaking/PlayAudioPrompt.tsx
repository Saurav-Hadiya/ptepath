'use client';

import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayAudioPromptProps {
  instruction: string;
  isPlaying: boolean;
  hasPlayed: boolean;
  audioSupported: boolean;
  onPlay: () => void;
}

/**
 * TTS playback gate for listening-first question types (repeat sentence,
 * answer short). Playback must be triggered by this button's click handler —
 * calling speechSynthesis.speak() from an effect instead is silently dropped
 * by many mobile browsers (iOS Safari in particular) since it isn't a user
 * gesture, which is why audio "doesn't play" for some students.
 */
export default function PlayAudioPrompt({
  instruction,
  isPlaying,
  hasPlayed,
  audioSupported,
  onPlay,
}: PlayAudioPromptProps) {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-card border border-border-default bg-bg-page p-6 text-center">
      <span className="text-body-sm text-text-secondary">{instruction}</span>

      {!audioSupported ? (
        <>
          <span className="text-body-sm text-feedback-warning">
            Audio playback isn&apos;t supported in this browser.
          </span>
          <Button
            type="button"
            onClick={onPlay}
            className="gap-2 bg-action-default text-primary-foreground hover:bg-action-hover"
          >
            Continue Without Audio
          </Button>
        </>
      ) : isPlaying ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-17 items-center justify-center rounded-full bg-action-default text-primary-foreground shadow-button">
            <Volume2 className="size-6 animate-pulse" />
          </div>
          <span className="text-label-md text-action-default">Playing...</span>
        </div>
      ) : hasPlayed ? (
        <span className="font-display text-label-lg text-brand-primary">Get ready to speak...</span>
      ) : (
        <Button
          type="button"
          onClick={onPlay}
          aria-label="Play audio"
          className="flex size-17 items-center justify-center rounded-full bg-action-default p-0 text-primary-foreground shadow-button hover:bg-action-hover"
        >
          <Volume2 className="size-6" />
        </Button>
      )}
    </div>
  );
}
