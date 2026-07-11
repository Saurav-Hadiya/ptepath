export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ScoreBreakdown {
  score: number;
  displayScore: string;
  feedback: string;
}

export type ModuleType = 'speaking' | 'writing' | 'reading' | 'listening';

export type SpeakingQuestionType =
  | 'read_aloud'
  | 'repeat_sentence'
  | 'describe_image'
  | 'respond_situation'
  | 'answer_short';

export type WritingQuestionType = 'summarise_written_text' | 'write_essay';

export type ReadingQuestionType =
  | 'rw_fill_blanks'
  | 'mcq_multiple'
  | 'reorder_paragraphs'
  | 'reading_fill_blanks'
  | 'mcq_single';

export type ListeningQuestionType =
  | 'summarise_spoken'
  | 'mcq_multiple'
  | 'fill_blanks'
  | 'highlight_summary'
  | 'mcq_single'
  | 'select_missing'
  | 'highlight_incorrect'
  | 'write_dictation';

export interface BaseQuestion {
  id: string;
  type: string;
  isActive: boolean;
  attemptCount: number;
  avgScore: number;
  createdAt: string;
}

export interface DashboardStats {
  studentName: string;
  totalAttempts: number;
  totalMockTests: number;
  questionCounts: {
    speaking: number;
    writing: number;
    reading: number;
    listening: number;
  };
  activeMockTests: number;
}

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isFirstLogin: boolean;
  totalAttempts: number;
  totalMockTests: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalQuestions: number;
  attemptsToday: number;
  totalMockTestAttempts: number;
  recentLogins: Array<{
    id: string;
    name: string;
    lastActiveAt: string | null;
  }>;
  lowestScoringTypes: Array<{
    type: string;
    module: ModuleType;
    label: string;
    attemptCount: number;
    avgScore: number;
  }>;
}

export interface AdminSpeakingQuestion extends BaseQuestion {
  type: SpeakingQuestionType;
  content: string;
  imageUrl: string | null;
  acceptedAnswers: string[];
  speakingTime: number;
  preparationTime: number;
}

export interface AdminWritingQuestion extends BaseQuestion {
  type: WritingQuestionType;
  content: string;
  timeLimit: number;
  wordMin: number;
  wordMax: number;
}

export interface AdminReadingBlank {
  position: number;
  correctAnswer: string;
  options: string[];
}

export interface AdminReadingOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface AdminReadingParagraph {
  label: string;
  text: string;
}

export interface AdminReadingQuestion extends BaseQuestion {
  type: ReadingQuestionType;
  passage: string;
  question: string | null;
  blanks: AdminReadingBlank[];
  options: AdminReadingOption[];
  paragraphs: AdminReadingParagraph[];
  wordPool: string[];
}

export interface AdminListeningOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface AdminListeningBlank {
  position: number;
  correctWord: string;
}

export interface AdminListeningQuestion extends BaseQuestion {
  type: ListeningQuestionType;
  audioUrl: string;
  playLimit: number;
  question: string | null;
  options: AdminListeningOption[];
  transcript: string | null;
  blanks: AdminListeningBlank[];
  incorrectWordIndices: number[];
  correctSentence: string | null;
  timeLimit: number | null;
}

export interface SpeakingCounts {
  read_aloud: number;
  repeat_sentence: number;
  describe_image: number;
  respond_situation: number;
  answer_short: number;
}

export interface SpeakingQuestionListItem {
  id: string;
  type: SpeakingQuestionType;
  preview: string | null;
  imageUrl: string | null;
  speakingTime: number;
  preparationTime: number;
}

export interface SpeakingQuestion {
  id: string;
  type: SpeakingQuestionType;
  content: string;
  imageUrl: string | null;
  speakingTime: number;
  preparationTime: number;
}

export interface SpeakingScoreResult {
  contentScore: number | null;
  fluencyScore: number | null;
  pronunciationScore: number | null;
  engagementScore: number | null;
  finalScore: number;
  displayScore: string;
  wpm: number | null;
  feedback: string;
  correctAnswer?: string;
}

export interface WritingCounts {
  summarise_written_text: number;
  write_essay: number;
}

export interface WritingQuestionListItem {
  id: string;
  type: WritingQuestionType;
  preview: string | null;
  timeLimit: number;
  wordMin: number;
  wordMax: number;
}

export interface WritingQuestion {
  id: string;
  type: WritingQuestionType;
  content: string;
  timeLimit: number;
  wordMin: number;
  wordMax: number;
}

export interface WritingScoreResult {
  wordCount: number;
  wordCountScore: number;
  spellingScore: number;
  finalScore: number;
  displayScore: string;
  feedback: string;
  misspelledWords: string[];
  breakdown: {
    wordCount: { score: number; actual: number; min: number; max: number };
    spelling: { score: number; correct: number; incorrect: number; total: number };
  };
}

export interface ReadingCounts {
  rw_fill_blanks: number;
  mcq_multiple: number;
  reorder_paragraphs: number;
  reading_fill_blanks: number;
  mcq_single: number;
}

export interface ReadingQuestionListItem {
  id: string;
  type: ReadingQuestionType;
  preview: string | null;
}

export interface ReadingOption {
  label: string;
  text: string;
}

export interface ReadingBlank {
  position: number;
  options: string[];
}

export interface ReadingParagraph {
  text: string;
}

export interface ReadingQuestion {
  id: string;
  type: ReadingQuestionType;
  passage: string;
  question: string | null;
  options?: ReadingOption[];
  blanks?: ReadingBlank[];
  wordPool?: string[];
  paragraphs?: ReadingParagraph[];
}

export interface FillBlanksBreakdown {
  score: number;
  correctCount: number;
  totalBlanks: number;
  breakdown: Array<{
    blank: number;
    studentAnswer: string;
    correctAnswer: string;
    correct: boolean;
  }>;
}

export type MCQResultState = 'correct_selected' | 'wrong_selected' | 'missed' | 'neutral';

export interface MCQMultipleBreakdown {
  score: number;
  totalPoints: number;
  numberOfCorrect: number;
  optionResults: Array<{
    label: string;
    text: string;
    selected: boolean;
    isCorrect: boolean;
    result: MCQResultState;
  }>;
}

export interface ReorderBreakdown {
  score: number;
  correctPairs: number;
  totalPairs: number;
  studentSequence: string[];
  correctSequence: string[];
}

export interface MCQSingleBreakdown {
  score: number;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  correctAnswerText: string;
  optionResults: Array<{
    label: string;
    text: string;
    selected: boolean;
    isCorrect: boolean;
  }>;
}

export type ReadingBreakdown =
  | FillBlanksBreakdown
  | MCQMultipleBreakdown
  | ReorderBreakdown
  | MCQSingleBreakdown;

export interface ReadingScoreResult {
  questionType: ReadingQuestionType;
  finalScore: number;
  displayScore: string;
  feedback: string;
  breakdown: ReadingBreakdown;
}

export interface ListeningOption {
  label: string;
  text: string;
}

export interface ListeningBlank {
  position: number;
}

export interface ListeningQuestionListItem {
  id: string;
  type: ListeningQuestionType;
  audioUrl: string;
  playLimit: number;
  preview: string | null;
}

export interface ListeningQuestion {
  id: string;
  type: ListeningQuestionType;
  audioUrl: string;
  playLimit: number;
  question: string | null;
  options?: ListeningOption[];
  transcript?: string;
  blanks?: ListeningBlank[];
  /** Seconds. summarise_spoken only — undefined for every other type. */
  timeLimit?: number;
}

export interface ListeningCounts {
  summarise_spoken: number;
  mcq_multiple: number;
  fill_blanks: number;
  highlight_summary: number;
  mcq_single: number;
  select_missing: number;
  highlight_incorrect: number;
  write_dictation: number;
}

export interface SpellingResult {
  total: number;
  correct: number;
  incorrect: number;
  misspelled: string[];
  score: number;
}

export interface SummariseSpokenBreakdown {
  score: number;
  wordCount: number;
  wordCountScore: number;
  spellingScore: number;
  spellingResult: SpellingResult;
  misspelledWords: string[];
}

export type FillBlankState = 'exact' | 'close' | 'wrong';

export interface FillBlanksListeningBreakdown {
  score: number;
  totalPoints: number;
  totalBlanks: number;
  breakdown: Array<{
    blank: number;
    studentAnswer: string;
    correctAnswer: string;
    distance: number;
    points: number;
    result: FillBlankState;
  }>;
}

export type HighlightWordState = 'correct_click' | 'wrong_click' | 'missed' | 'neutral';

export interface HighlightIncorrectBreakdown {
  score: number;
  totalPoints: number;
  totalIncorrect: number;
  wordResults: Array<{
    index: number;
    clicked: boolean;
    isIncorrect: boolean;
    result: HighlightWordState;
  }>;
}

export type DictationState = 'exact' | 'close' | 'missed';

export interface WriteDictationBreakdown {
  score: number;
  wordMatchScore: number;
  spellingScore: number;
  matchedWords: number;
  exactMatches: number;
  totalWords: number;
  correctSentence: string;
  breakdown: Array<{
    correctWord: string;
    studentWord: string | null;
    distance: number;
    result: DictationState;
  }>;
}

export type ListeningBreakdown =
  | SummariseSpokenBreakdown
  | MCQMultipleBreakdown
  | MCQSingleBreakdown
  | FillBlanksListeningBreakdown
  | HighlightIncorrectBreakdown
  | WriteDictationBreakdown;

export interface ListeningScoreResult {
  questionType: ListeningQuestionType;
  finalScore: number;
  displayScore: string;
  feedback: string;
  breakdown: ListeningBreakdown;
}

export interface MockTestQuestionRule {
  module: ModuleType;
  type: string;
  count: number;
}

export interface MockTestTemplate {
  id: string;
  name: string;
  description: string;
  totalTime: number;
  questionRules: MockTestQuestionRule[];
  isActive: boolean;
  attemptCount: number;
  avgScore: number;
}

/** Student-facing template summary — never exposes attemptCount / avgScore. */
export interface MockTestTemplateSummary {
  id: string;
  name: string;
  description: string;
  /** Total time in minutes. */
  totalTime: number;
  questionRules: MockTestQuestionRule[];
  totalQuestions: number;
}

/** Per-module question payloads returned by the start endpoint (correct answers stripped). */
export interface MockSpeakingData {
  /** null for describe_image — that type is image-only, with no text content. */
  content: string | null;
  imageUrl: string | null;
}

export interface MockWritingData {
  content: string;
  timeLimit: number;
  wordMin: number;
  wordMax: number;
}

export interface MockReadingData {
  passage: string;
  question: string | null;
  options?: ReadingOption[];
  blanks?: ReadingBlank[];
  wordPool?: string[];
  paragraphs?: ReadingParagraph[];
}

export interface MockListeningData {
  audioUrl: string;
  playLimit: number;
  question: string | null;
  options?: ListeningOption[];
  transcript?: string;
  blanks?: ListeningBlank[];
}

export type MockQuestionData =
  | MockSpeakingData
  | MockWritingData
  | MockReadingData
  | MockListeningData;

interface MockTestQuestionBase {
  id: string;
  questionType: string;
  /** Speaking / writing only — seconds; null for reading & listening. */
  speakingTime: number | null;
  preparationTime: number | null;
}

/**
 * Discriminated union on `module` — narrowing on `question.module` (e.g. in a
 * switch) automatically narrows `questionData` to the matching shape, so
 * consumers never need an `as MockSpeakingData`-style cast.
 */
export type MockTestQuestion =
  | (MockTestQuestionBase & { module: 'speaking'; questionData: MockSpeakingData })
  | (MockTestQuestionBase & { module: 'writing'; questionData: MockWritingData })
  | (MockTestQuestionBase & { module: 'reading'; questionData: MockReadingData })
  | (MockTestQuestionBase & { module: 'listening'; questionData: MockListeningData });

export interface MockTestStartData {
  templateId: string;
  templateName: string;
  /** Total time in minutes. */
  totalTime: number;
  totalQuestions: number;
  questions: MockTestQuestion[];
}

/** A single answer value as expected by the module scorers on submit. */
export type MockAnswerValue = string | string[] | number[];

export interface MockTestAnswerPayload {
  questionId: string;
  questionType: string;
  module: ModuleType;
  /** Raw answer for non-speaking modules; null for speaking / unanswered. */
  answer?: MockAnswerValue | null;
  /** Pre-scored value for speaking (via Groq during the test); null otherwise. */
  score?: number | null;
}

export interface MockTestSubmitPayload {
  answers: MockTestAnswerPayload[];
  /** Whole minutes elapsed. */
  timeTaken: number;
}

export interface MockTestQuestionResult {
  questionId: string;
  questionType: string;
  score: number;
  displayScore: string;
  breakdown: unknown;
}

export interface MockTestModuleResult {
  score: number;
  displayScore: string;
  questions: MockTestQuestionResult[];
}

export interface MockTestResult {
  overallScore: number;
  displayScore: string;
  timeTaken: number;
  questionsAnswered: number;
  modules: Record<ModuleType, MockTestModuleResult>;
}
