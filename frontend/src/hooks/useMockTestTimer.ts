'use client';

import { useMemo } from 'react';
import { useTimer } from '@/hooks/useTimer';

export type TimerWarningLevel = 'none' | 'warning' | 'danger';

interface UseMockTestTimerOptions {
  totalSeconds: number;
  onExpire: () => void;
  autoStart?: boolean;
}

const WARNING_THRESHOLD = 600; // 10 minutes
const DANGER_THRESHOLD = 300; // 5 minutes

/** Formats seconds as H:MM:SS when an hour or more remains, otherwise M:SS. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Overall mock-test countdown. Wraps the shared useTimer for the interval logic
 * and layers on display formatting + warning thresholds (amber < 10 min, red < 5 min).
 */
export function useMockTestTimer({ totalSeconds, onExpire, autoStart = true }: UseMockTestTimerOptions) {
  const { seconds, isRunning, start, pause, stop } = useTimer({
    initialSeconds: totalSeconds,
    onExpire,
    autoStart,
  });

  const warningLevel: TimerWarningLevel = useMemo(() => {
    if (seconds <= DANGER_THRESHOLD) return 'danger';
    if (seconds <= WARNING_THRESHOLD) return 'warning';
    return 'none';
  }, [seconds]);

  return {
    timeRemaining: seconds,
    formattedTime: formatCountdown(seconds),
    warningLevel,
    isRunning,
    start,
    pause,
    stop,
  };
}
