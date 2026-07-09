'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
  audioUrl: string;
  playLimit: number;
  onPlayLimitReached?: () => void;
  /** Fires every time playback reaches the end — regardless of play limit. */
  onEnded?: () => void;
}

export interface AudioPlayerHandle {
  pause: () => void;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(function AudioPlayer(
  { audioUrl, playLimit, onPlayLimitReached, onEnded },
  ref
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playsUsed, setPlaysUsed] = useState(0);

  const limitReached = playLimit > 0 && playsUsed >= playLimit;

  useImperativeHandle(ref, () => ({
    pause: () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    },
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio || limitReached) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    const nextPlaysUsed = playsUsed + 1;
    setPlaysUsed(nextPlaysUsed);
    audio.currentTime = 0;
    void audio.play();
    setIsPlaying(true);

    if (playLimit > 0 && nextPlaysUsed >= playLimit) {
      onPlayLimitReached?.();
    }
  };

  const playedRatio = duration > 0 ? (currentTime / duration) * 100 : 0;

  const limitLabel =
    playLimit === 0
      ? 'Unlimited'
      : playLimit - playsUsed <= 0
        ? 'No more plays'
        : playLimit === 1
          ? 'Plays once'
          : `${playLimit - playsUsed} play${playLimit - playsUsed === 1 ? '' : 's'} remaining`;

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border-default bg-bg-page p-4 sm:flex-row sm:items-center sm:gap-3.5">
      <audio ref={audioRef} src={audioUrl} className="hidden" />

      <div className="flex items-center gap-3.5">
        <Button
          type="button"
          onClick={handleTogglePlay}
          disabled={limitReached}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-action-default p-0 text-primary-foreground hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50 sm:size-10"
        >
          {isPlaying ? (
            <Pause className="size-4" fill="currentColor" />
          ) : (
            <Play className="size-4" fill="currentColor" />
          )}
        </Button>

        <span className="text-label-sm text-text-muted tabular-nums sm:hidden">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <span className="shrink-0 rounded-pill border border-feedback-warning/25 bg-bg-accent px-2.5 py-1 text-label-sm font-semibold text-feedback-warning sm:hidden">
          {limitLabel}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <ProgressPrimitive.Root value={playedRatio} className="block w-full">
          <ProgressPrimitive.Track className="relative h-1.5 w-full overflow-hidden rounded-full bg-border-default">
            <ProgressPrimitive.Indicator className="h-full rounded-full bg-action-default transition-[width]" />
          </ProgressPrimitive.Track>
        </ProgressPrimitive.Root>
        <div className="mt-1.5 hidden justify-between text-label-sm text-text-muted sm:flex">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <span className="hidden shrink-0 rounded-pill border border-feedback-warning/25 bg-bg-accent px-2.5 py-1 text-label-sm font-semibold text-feedback-warning sm:inline-block">
        {limitLabel}
      </span>
    </div>
  );
});

export default AudioPlayer;
