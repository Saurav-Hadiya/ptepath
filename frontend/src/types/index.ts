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
