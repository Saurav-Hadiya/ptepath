'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerProps {
  initialSeconds: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

export function useTimer({ initialSeconds, onExpire, autoStart = false }: UseTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const stop = useCallback(() => {
    setIsRunning(false);
    clear();
  }, [clear]);

  const reset = useCallback(
    (newSeconds?: number) => {
      clear();
      setSeconds(newSeconds ?? initialSeconds);
      setIsRunning(false);
    },
    [clear, initialSeconds]
  );

  // Tick — the updater stays a pure function of its previous value. Firing
  // onExpire (or any other side effect) from inside a setState updater is
  // invalid: React can invoke that updater while a *different* component is
  // mid-render, and onExpire here cascades into a parent's setState — which
  // is exactly the "Cannot update a component while rendering a different
  // component" class of bug. Side effects belong in the effect below instead.
  useEffect(() => {
    if (!isRunning) {
      clear();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return clear;
  }, [isRunning, clear]);

  // Fires exactly once when the countdown reaches zero, as its own effect —
  // safe to call setState here (including a parent's, via onExpire) since
  // effects always run after the commit, never during another render.
  useEffect(() => {
    if (isRunning && seconds === 0) {
      setIsRunning(false);
      onExpireRef.current?.();
    }
  }, [seconds, isRunning]);

  useEffect(() => {
    return clear;
  }, [clear]);

  return { seconds, isRunning, start, pause, reset, stop };
}
