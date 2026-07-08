'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSpeakingRecorder } from '@/hooks/useSpeakingRecorder';
import { useTimer } from '@/hooks/useTimer';
import type { SpeakingScoreResult } from '@/types';

export type AttemptPhase = 'preparing' | 'listening' | 'recording' | 'processing' | 'scored';

interface UseSpeakingAttemptOptions {
  /** Seconds shown to the student before recording starts. 0 skips straight to recording. Ignored when ttsText is set. */
  preparationTime: number;
  /** Seconds the student has to speak once recording starts. */
  speakingTime: number;
  /** When set, the attempt opens by speaking this text aloud instead of a prep countdown. */
  ttsText?: string;
  /** Called once the student's audio has been captured — must call the matching evaluate service function. */
  onSubmit: (audioBlob: Blob, recordingDurationSeconds: number) => Promise<SpeakingScoreResult>;
}

/** Finds the clearest available English voice — falls back gracefully if none match. */
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const preferredNames = /Google US English|Samantha|Microsoft (Aria|Jenny)|Natural/i;
  return (
    voices.find((voice) => voice.lang === 'en-US' && preferredNames.test(voice.name)) ??
    voices.find((voice) => voice.lang === 'en-US') ??
    voices.find((voice) => voice.lang.startsWith('en'))
  );
}

/**
 * Shared state machine for every speaking question type. Centralizes the
 * preparation/listening -> recording -> processing -> scored flow, TTS
 * playback, and audio submission so each question component only needs to
 * render its own prompt (text, image, or situation).
 */
export function useSpeakingAttempt({
  preparationTime,
  speakingTime,
  ttsText,
  onSubmit,
}: UseSpeakingAttemptOptions) {
  const [phase, setPhase] = useState<AttemptPhase>(ttsText ? 'listening' : 'preparing');
  const [textRevealed, setTextRevealed] = useState(!ttsText);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const [score, setScore] = useState<SpeakingScoreResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submittedBlobRef = useRef<Blob | null>(null);
  const submittingRef = useRef(false);
  const recordingStartedAtRef = useRef(0);

  // Web Speech Synthesis is only reliable when speak() is called directly
  // inside a user gesture (tap/click) — most browsers (notably iOS/mobile
  // Safari) silently drop autoplayed speech otherwise. audioSupported also
  // covers browsers that lack the API entirely.
  const audioSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const { isRecording, audioBlob, error: micError, startRecording, stopRecording, resetRecorder } =
    useSpeakingRecorder();

  const beginRecording = useCallback(async () => {
    setPhase('recording');
    recordingStartedAtRef.current = Date.now();
    await startRecording();
  }, [startRecording]);

  const speakTimer = useTimer({
    initialSeconds: speakingTime,
    onExpire: stopRecording,
  });

  const prepTimer = useTimer({
    initialSeconds: preparationTime,
    onExpire: beginRecording,
    autoStart: !ttsText && preparationTime > 0,
  });

  // No prep time and no TTS prompt — start recording immediately on mount.
  useEffect(() => {
    if (!ttsText && preparationTime <= 0) {
      beginRecording();
    }
    // Intentionally run only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Plays the question prompt aloud — must be called directly from a click
   * handler (not an effect) so browsers treat it as a user gesture and
   * actually play it. Safe to call again to replay before recording starts.
   */
  const playAudio = useCallback(() => {
    if (!ttsText || phase !== 'listening' || isPlayingAudio) return;

    if (!audioSupported) {
      // No TTS support at all — reveal the prompt and go straight to recording.
      setTextRevealed(true);
      setHasPlayedAudio(true);
      beginRecording();
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const applyVoice = () => {
      const best = pickBestVoice(synth.getVoices());
      if (best) utterance.voice = best;
    };

    if (synth.getVoices().length > 0) {
      applyVoice();
    } else {
      synth.onvoiceschanged = applyVoice;
    }

    const finishPlayback = () => {
      setIsPlayingAudio(false);
      setTextRevealed(true);
      window.setTimeout(beginRecording, 1000);
    };

    utterance.onend = finishPlayback;
    utterance.onerror = finishPlayback;

    setIsPlayingAudio(true);
    setHasPlayedAudio(true);
    synth.speak(utterance);
  }, [ttsText, phase, isPlayingAudio, audioSupported, beginRecording]);

  // Start the speaking countdown once recording actually begins.
  useEffect(() => {
    if (phase === 'recording' && !speakTimer.isRunning && speakTimer.seconds > 0) {
      speakTimer.start();
    }
  }, [phase, speakTimer]);

  const submitBlob = useCallback(
    (blob: Blob) => {
      submittingRef.current = true;
      submittedBlobRef.current = blob;
      setSubmitError(null);
      setPhase('processing');
      const duration = Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000));

      onSubmit(blob, duration)
        .then((result) => {
          setScore(result);
          setPhase('scored');
        })
        .catch((err: unknown) => {
          submittingRef.current = false;
          setSubmitError(err instanceof Error ? err.message : 'Failed to submit your recording.');
        });
    },
    [onSubmit]
  );

  // Fire submission exactly once per recording.
  useEffect(() => {
    if (audioBlob && !submittingRef.current) {
      submitBlob(audioBlob);
    }
  }, [audioBlob, submitBlob]);

  const retrySubmit = useCallback(() => {
    if (submittedBlobRef.current) {
      submitBlob(submittedBlobRef.current);
    }
  }, [submitBlob]);

  /** Lets a prepared student skip the remaining prep countdown and start speaking now. */
  const skipPreparation = useCallback(() => {
    if (phase !== 'preparing') return;
    prepTimer.stop();
    beginRecording();
  }, [phase, prepTimer, beginRecording]);

  /** Lets the student finish and submit before the speaking timer runs out. */
  const submitNow = useCallback(() => {
    if (phase !== 'recording' || !isRecording) return;
    speakTimer.stop();
    stopRecording();
  }, [phase, isRecording, speakTimer, stopRecording]);

  // Never leave the mic hot or TTS talking if the student navigates away mid-attempt.
  useEffect(() => {
    return () => {
      stopRecording();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    textRevealed,
    isPlayingAudio,
    hasPlayedAudio,
    audioSupported,
    playAudio,
    score,
    submitError,
    micError,
    retrySubmit,
    prepSecondsLeft: prepTimer.seconds,
    prepTotalSeconds: preparationTime,
    speakSecondsLeft: speakTimer.seconds,
    speakTotalSeconds: speakingTime,
    skipPreparation,
    submitNow,
    resetRecorder,
  };
}
