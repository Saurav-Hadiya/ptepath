'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Priority-ordered mime types. Chrome/Firefox/Edge/Android support Opus-in-WebM;
 * Safari (macOS + iOS 14.3+) only supports MP4/AAC. Checking in this order picks
 * the best quality codec each browser actually supports.
 */
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/aac',
];

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  return MIME_CANDIDATES.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? '';
}

/** File extension the backend/STT service should see for a given recorded mime type. */
export function extensionForMimeType(mime: string): string {
  if (mime.includes('mp4') || mime.includes('aac')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

function describeMicError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Microphone access is required to record your speaking response. Please allow microphone access and try again.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No microphone was found on this device. Please connect a microphone and try again.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your microphone is being used by another application. Please close it and try again.';
  }
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return 'This browser does not support audio recording. Please use a recent version of Chrome, Safari, or Firefox.';
  }
  return 'Microphone access is required to record your speaking response.';
}

export function useSpeakingRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    chunksRef.current = [];

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      setError(describeMicError(null));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: { ideal: 48000 },
        },
      });
      streamRef.current = stream;

      const supportedMime = pickSupportedMimeType();
      const options: MediaRecorderOptions = { audioBitsPerSecond: 128000 };
      if (supportedMime) options.mimeType = supportedMime;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      setMimeType(mediaRecorder.mimeType || supportedMime);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const finalMime = mediaRecorder.mimeType || supportedMime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        setAudioBlob(blob);
        setIsRecording(false);
        releaseStream();
      };

      mediaRecorder.onerror = () => {
        setError('Recording failed unexpectedly. Please try again.');
        setIsRecording(false);
        releaseStream();
      };

      // Collect data periodically so a crash/navigation mid-recording doesn't lose everything.
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      setError(describeMicError(err));
      setIsRecording(false);
      releaseStream();
    }
  }, [releaseStream]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      releaseStream();
      setIsRecording(false);
    }
  }, [releaseStream]);

  const resetRecorder = useCallback(() => {
    setAudioBlob(null);
    setError(null);
    setMimeType('');
    chunksRef.current = [];
  }, []);

  // Never leave the microphone active if the component unmounts mid-recording.
  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      releaseStream();
    };
  }, [releaseStream]);

  return {
    isRecording,
    audioBlob,
    mimeType,
    error,
    startRecording,
    stopRecording,
    resetRecorder,
  };
}
