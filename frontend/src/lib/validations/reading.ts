import { z } from 'zod';

const readingQuestionType = z.enum([
  'rw_fill_blanks',
  'mcq_multiple',
  'reorder_paragraphs',
  'reading_fill_blanks',
  'mcq_single',
]);

export const readingOptionSchema = z.object({ label: z.string(), text: z.string() });
export const readingBlankSchema = z.object({ position: z.number(), options: z.array(z.string()) });
export const readingParagraphSchema = z.object({ text: z.string() });

/** Validates the question-fetch response before it reaches UI state — the shape varies by type. */
export const readingQuestionSchema = z.object({
  id: z.string(),
  type: readingQuestionType,
  passage: z.string(),
  question: z.string().nullable(),
  options: z.array(readingOptionSchema).optional(),
  blanks: z.array(readingBlankSchema).optional(),
  wordPool: z.array(z.string()).optional(),
  paragraphs: z.array(readingParagraphSchema).optional(),
});

export const readingCountsSchema = z.object({
  rw_fill_blanks: z.number(),
  mcq_multiple: z.number(),
  reorder_paragraphs: z.number(),
  reading_fill_blanks: z.number(),
  mcq_single: z.number(),
});

const fillBlanksBreakdownSchema = z.object({
  score: z.number(),
  correctCount: z.number(),
  totalBlanks: z.number(),
  breakdown: z.array(
    z.object({
      blank: z.number(),
      studentAnswer: z.string(),
      correctAnswer: z.string(),
      correct: z.boolean(),
    })
  ),
});

const mcqMultipleBreakdownSchema = z.object({
  score: z.number(),
  totalPoints: z.number(),
  numberOfCorrect: z.number(),
  optionResults: z.array(
    z.object({
      label: z.string(),
      text: z.string(),
      selected: z.boolean(),
      isCorrect: z.boolean(),
      result: z.enum(['correct_selected', 'wrong_selected', 'missed', 'neutral']),
    })
  ),
});

const reorderBreakdownSchema = z.object({
  score: z.number(),
  correctPairs: z.number(),
  totalPairs: z.number(),
  studentSequence: z.array(z.string()),
  correctSequence: z.array(z.string()),
});

const mcqSingleBreakdownSchema = z.object({
  score: z.number(),
  isCorrect: z.boolean(),
  studentAnswer: z.string(),
  correctAnswer: z.string(),
  correctAnswerText: z.string(),
  optionResults: z.array(
    z.object({
      label: z.string(),
      text: z.string(),
      selected: z.boolean(),
      isCorrect: z.boolean(),
    })
  ),
});

/** breakdown shape depends on questionType — the four scorer outputs have disjoint required keys. */
export const readingScoreResultSchema = z.object({
  questionType: readingQuestionType,
  finalScore: z.number(),
  displayScore: z.string(),
  feedback: z.string(),
  breakdown: z.union([
    fillBlanksBreakdownSchema,
    mcqMultipleBreakdownSchema,
    reorderBreakdownSchema,
    mcqSingleBreakdownSchema,
  ]),
});
