import { Request } from 'express';

export type UserRole = 'student' | 'admin';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  tokenVersion: number;
  isFirstLogin?: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    tokenVersion?: number;
  };
}

export interface ScoreResult {
  score: number;
  maxScore: number;
  displayScore: string;
}

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
