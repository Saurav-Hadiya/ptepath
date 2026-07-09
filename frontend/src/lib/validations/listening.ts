import { z } from 'zod';

const listeningQuestionType = z.enum([
  'summarise_spoken',
  'mcq_multiple',
  'fill_blanks',
  'highlight_summary',
  'mcq_single',
  'select_missing',
  'highlight_incorrect',
  'write_dictation',
]);

export const listeningOptionSchema = z.object({ label: z.string(), text: z.string() });
export const listeningBlankSchema = z.object({ position: z.number() });

/** Question shape varies by type — every conditional field is optional here. */
export const listeningQuestionSchema = z.object({
  id: z.string(),
  type: listeningQuestionType,
  audioUrl: z.string(),
  playLimit: z.number(),
  question: z.string().nullable(),
  options: z.array(listeningOptionSchema).optional(),
  transcript: z.string().optional(),
  blanks: z.array(listeningBlankSchema).optional(),
  timeLimit: z.number().optional(),
});

export const listeningCountsSchema = z.object({
  summarise_spoken: z.number(),
  mcq_multiple: z.number(),
  fill_blanks: z.number(),
  highlight_summary: z.number(),
  mcq_single: z.number(),
  select_missing: z.number(),
  highlight_incorrect: z.number(),
  write_dictation: z.number(),
});

const spellingResultSchema = z.object({
  total: z.number(),
  correct: z.number(),
  incorrect: z.number(),
  misspelled: z.array(z.string()),
  score: z.number(),
});

const summariseSpokenBreakdownSchema = z.object({
  score: z.number(),
  wordCount: z.number(),
  wordCountScore: z.number(),
  spellingScore: z.number(),
  spellingResult: spellingResultSchema,
  misspelledWords: z.array(z.string()),
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

const fillBlanksListeningBreakdownSchema = z.object({
  score: z.number(),
  totalPoints: z.number(),
  totalBlanks: z.number(),
  breakdown: z.array(
    z.object({
      blank: z.number(),
      studentAnswer: z.string(),
      correctAnswer: z.string(),
      distance: z.number(),
      points: z.number(),
      result: z.enum(['exact', 'close', 'wrong']),
    })
  ),
});

const highlightIncorrectBreakdownSchema = z.object({
  score: z.number(),
  totalPoints: z.number(),
  totalIncorrect: z.number(),
  wordResults: z.array(
    z.object({
      index: z.number(),
      clicked: z.boolean(),
      isIncorrect: z.boolean(),
      result: z.enum(['correct_click', 'wrong_click', 'missed', 'neutral']),
    })
  ),
});

const writeDictationBreakdownSchema = z.object({
  score: z.number(),
  wordMatchScore: z.number(),
  spellingScore: z.number(),
  matchedWords: z.number(),
  exactMatches: z.number(),
  totalWords: z.number(),
  correctSentence: z.string(),
  breakdown: z.array(
    z.object({
      correctWord: z.string(),
      studentWord: z.string().nullable(),
      distance: z.number(),
      result: z.enum(['exact', 'close', 'missed']),
    })
  ),
});

/** breakdown shape depends on questionType — the six scorer outputs have disjoint required keys. */
export const listeningScoreResultSchema = z.object({
  questionType: listeningQuestionType,
  finalScore: z.number(),
  displayScore: z.string(),
  feedback: z.string(),
  breakdown: z.union([
    summariseSpokenBreakdownSchema,
    mcqMultipleBreakdownSchema,
    mcqSingleBreakdownSchema,
    fillBlanksListeningBreakdownSchema,
    highlightIncorrectBreakdownSchema,
    writeDictationBreakdownSchema,
  ]),
});
