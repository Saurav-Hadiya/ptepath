import { z } from 'zod';
import { readingOptionSchema, readingBlankSchema, readingParagraphSchema } from '@/lib/validations/reading';
import { listeningOptionSchema, listeningBlankSchema } from '@/lib/validations/listening';

const moduleEnum = z.enum(['speaking', 'writing', 'reading', 'listening']);

const questionRuleSchema = z.object({
  module: moduleEnum,
  type: z.string(),
  count: z.number(),
});

export const mockTestTemplateSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  totalTime: z.number(),
  questionRules: z.array(questionRuleSchema),
  totalQuestions: z.number(),
});

export const mockTestTemplateListSchema = z.array(mockTestTemplateSummarySchema);

// ─── Per-module questionData shapes (reusing each module's own sub-schemas) ──

const mockSpeakingDataSchema = z.object({
  // Null for describe_image — that type is image-only, with no text content.
  content: z.string().nullable(),
  imageUrl: z.string().nullable(),
});

const mockWritingDataSchema = z.object({
  content: z.string(),
  timeLimit: z.number(),
  wordMin: z.number(),
  wordMax: z.number(),
});

const mockReadingDataSchema = z.object({
  passage: z.string(),
  question: z.string().nullable(),
  options: z.array(readingOptionSchema).optional(),
  blanks: z.array(readingBlankSchema).optional(),
  wordPool: z.array(z.string()).optional(),
  paragraphs: z.array(readingParagraphSchema).optional(),
});

const mockListeningDataSchema = z.object({
  audioUrl: z.string(),
  playLimit: z.number(),
  question: z.string().nullable(),
  options: z.array(listeningOptionSchema).optional(),
  transcript: z.string().optional(),
  blanks: z.array(listeningBlankSchema).optional(),
});

const mockQuestionBaseFields = {
  id: z.string(),
  questionType: z.string(),
  speakingTime: z.number().nullable(),
  preparationTime: z.number().nullable(),
};

/**
 * Discriminated union on `module` — each branch's `questionData` is validated
 * against the exact shape that module's start-payload builder produces on the
 * backend. A mismatched/renamed field throws here instead of silently
 * rendering a broken question.
 */
const mockQuestionSchema = z.discriminatedUnion('module', [
  z.object({ ...mockQuestionBaseFields, module: z.literal('speaking'), questionData: mockSpeakingDataSchema }),
  z.object({ ...mockQuestionBaseFields, module: z.literal('writing'), questionData: mockWritingDataSchema }),
  z.object({ ...mockQuestionBaseFields, module: z.literal('reading'), questionData: mockReadingDataSchema }),
  z.object({ ...mockQuestionBaseFields, module: z.literal('listening'), questionData: mockListeningDataSchema }),
]);

export const mockTestStartSchema = z.object({
  templateId: z.string(),
  templateName: z.string(),
  totalTime: z.number(),
  totalQuestions: z.number(),
  questions: z.array(mockQuestionSchema),
});

const moduleResultSchema = z.object({
  score: z.number(),
  displayScore: z.string(),
  questions: z.array(
    z.object({
      questionId: z.string(),
      questionType: z.string(),
      score: z.number(),
      displayScore: z.string(),
      breakdown: z.unknown(),
    })
  ),
});

export const mockTestResultSchema = z.object({
  overallScore: z.number(),
  displayScore: z.string(),
  timeTaken: z.number(),
  questionsAnswered: z.number(),
  modules: z.object({
    speaking: moduleResultSchema,
    writing: moduleResultSchema,
    reading: moduleResultSchema,
    listening: moduleResultSchema,
  }),
});
