import mongoose, { Schema, Document } from 'mongoose';
import { ReadingQuestionType } from '../types';

export interface IReadingBlank {
  position: number;
  correctAnswer: string;
  options: string[];
}

export interface IReadingOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface IReadingParagraph {
  label: string;
  text: string;
}

export interface IReadingQuestion extends Document {
  type: ReadingQuestionType;
  passage: string;
  question: string | null;
  blanks: IReadingBlank[];
  options: IReadingOption[];
  paragraphs: IReadingParagraph[];
  wordPool: string[];
  isActive: boolean;
  createdAt: Date;
  attemptCount: number;
  avgScore: number;
}

// Fill-blank types (rw_fill_blanks, reading_fill_blanks).
const blankSchema = new Schema<IReadingBlank>(
  {
    position: { type: Number, required: true },
    correctAnswer: { type: String, required: true },
    options: { type: [String], default: [] },
  },
  { _id: false }
);

// MCQ types (mcq_multiple, mcq_single).
const optionSchema = new Schema<IReadingOption>(
  {
    label: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

// Reorder type — stored in the correct order; shuffled before sending to students.
const paragraphSchema = new Schema<IReadingParagraph>(
  {
    label: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const readingQuestionSchema = new Schema<IReadingQuestion>({
  type: {
    type: String,
    required: true,
    enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'],
  },
  passage: { type: String, required: true },
  // Question text — only for MCQ types; null for fill-blank and reorder types.
  question: { type: String, default: null },
  blanks: { type: [blankSchema], default: [] },
  options: { type: [optionSchema], default: [] },
  paragraphs: { type: [paragraphSchema], default: [] },
  wordPool: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  attemptCount: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },
});

export const ReadingQuestion = mongoose.model<IReadingQuestion>(
  'ReadingQuestion',
  readingQuestionSchema
);
