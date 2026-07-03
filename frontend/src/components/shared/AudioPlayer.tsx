'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
  audioUrl: string;
  playLimit: number;
  onPlayLimitReached?: () => void;
}

const WAVEFORM_BARS = 40;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function AudioPlayer({ audioUrl, playLimit, onPlayLimitReached }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playsUsed, setPlaysUsed] = useState(0);

  const limitReached = playLimit > 0 && playsUsed >= playLimit;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
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

  const playedRatio = duration > 0 ? currentTime / duration : 0;
  const playedBars = Math.round(playedRatio * WAVEFORM_BARS);

  const limitLabel =
    playLimit === 0
      ? 'Unlimited'
      : playLimit - playsUsed <= 0
        ? 'No more plays'
        : playLimit === 1
          ? 'Plays once'
          : `${playLimit - playsUsed} play${playLimit - playsUsed === 1 ? '' : 's'} remaining`;

  return (
    <div className="flex items-center gap-3.5 rounded-card border border-border-default bg-bg-page p-4">
      <audio ref={audioRef} src={audioUrl} className="hidden" />

      <Button
        type="button"
        onClick={handleTogglePlay}
        disabled={limitReached}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action-default p-0 text-white hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
      </Button>

      <div className="flex-1">
        <div className="mb-1.5 flex h-7 items-center gap-0.5">
          {Array.from({ length: WAVEFORM_BARS }).map((_, index) => (
            <span
              key={index}
              className={`h-full w-0.75 rounded-sm ${
                index < playedBars ? 'bg-action-default' : 'bg-border-default'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-label-sm text-text-muted">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <span className="shrink-0 rounded-pill border border-feedback-warning/25 bg-bg-accent px-2.5 py-1 text-label-sm font-semibold text-feedback-warning">
        {limitLabel}
      </span>
    </div>
  );
}
