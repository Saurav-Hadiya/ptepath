import Groq, { toFile } from 'groq-sdk';
import { env } from '../config/env';

/**
 * STT Adapter — the ONLY file that imports groq-sdk.
 *
 * This is the isolated, swappable speech-to-text layer. All speaking scoring
 * calls only this file. If Groq is ever replaced with another provider, only
 * this file changes — the input/output contract stays identical.
 *
 *   Input:  in-memory audio (buffer + filename)
 *   Output: { transcript: string, words: Array<{ word, start, end }> }
 *
 * Audio is streamed straight from memory to Groq and never written to disk.
 */

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  transcript: string;
  words: TranscriptWord[];
}

export interface AudioInput {
  buffer: Buffer;
  filename: string;
}

interface TranscribeOptions {
  /** Word timestamps add latency — only request them when fluency is scored. */
  wordTimestamps?: boolean;
}

const groq = new Groq({ apiKey: env.groqApiKey });

export default async function transcribeAudio(
  audio: AudioInput,
  options: TranscribeOptions = {}
): Promise<TranscriptionResult> {
  const { wordTimestamps = true } = options;

  const file = await toFile(audio.buffer, audio.filename || 'audio.webm');

  const response = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3-turbo',
    language: 'en',
    response_format: wordTimestamps ? 'verbose_json' : 'json',
    ...(wordTimestamps ? { timestamp_granularities: ['word' as const] } : {}),
  });

  // verbose_json with word granularity returns a `words` array that is not in
  // the SDK's narrow Transcription type — read it through a loose cast.
  const raw = response as unknown as {
    text?: string;
    words?: Array<{ word: string; start: number; end: number }>;
  };

  const transcript = raw.text ?? '';
  const words: TranscriptWord[] = Array.isArray(raw.words)
    ? raw.words.map((w) => ({ word: w.word, start: w.start, end: w.end }))
    : [];

  return { transcript, words };
}
