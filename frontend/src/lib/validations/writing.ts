import { z } from 'zod';

/** Validates the evaluate/* response shape before it reaches UI state — network data is never trusted as-is. */
export const writingScoreResultSchema = z.object({
  wordCount: z.number(),
  wordCountScore: z.number(),
  spellingScore: z.number(),
  finalScore: z.number(),
  displayScore: z.string(),
  feedback: z.string(),
  misspelledWords: z.array(z.string()),
  breakdown: z.object({
    wordCount: z.object({ score: z.number(), actual: z.number(), min: z.number(), max: z.number() }),
    spelling: z.object({
      score: z.number(),
      correct: z.number(),
      incorrect: z.number(),
      total: z.number(),
    }),
  }),
});

export const writingQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['summarise_written_text', 'write_essay']),
  content: z.string(),
  timeLimit: z.number(),
  wordMin: z.number(),
  wordMax: z.number(),
});

export const writingCountsSchema = z.object({
  summarise_written_text: z.number(),
  write_essay: z.number(),
});
