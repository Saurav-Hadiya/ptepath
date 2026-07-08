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

export interface MockTestTemplate {
  id: string;
  name: string;
  description: string;
  totalTime: number;
  questionRules: Array<{
    module: ModuleType;
    type: string;
    count: number;
  }>;
  isActive: boolean;
  attemptCount: number;
  avgScore: number;
}
