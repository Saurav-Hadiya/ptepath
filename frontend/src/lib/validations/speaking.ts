import { z } from 'zod';

/** Validates the evaluate/* response shape before it reaches UI state — network data is never trusted as-is. */
export const speakingScoreResultSchema = z.object({
  contentScore: z.number().nullable(),
  fluencyScore: z.number().nullable(),
  pronunciationScore: z.number().nullable(),
  engagementScore: z.number().nullable(),
  finalScore: z.number(),
  displayScore: z.string(),
  wpm: z.number().nullable(),
  feedback: z.string(),
  correctAnswer: z.string().optional(),
});

export const speakingQuestionSchema = z.object({
  id: z.string(),
  type: z.string(),
  // Absent entirely for describe_image (Mongoose omits unset optional string
  // fields from the JSON response rather than sending null), so this must
  // tolerate missing/null and normalize to an empty string.
  content: z.string().nullish().transform((value) => value ?? ''),
  imageUrl: z.string().nullish().transform((value) => value ?? null),
  speakingTime: z.number(),
  preparationTime: z.number(),
});

export const speakingCountsSchema = z.object({
  read_aloud: z.number(),
  repeat_sentence: z.number(),
  describe_image: z.number(),
  respond_situation: z.number(),
  answer_short: z.number(),
});
