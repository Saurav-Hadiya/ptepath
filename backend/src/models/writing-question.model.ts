import mongoose, { Schema, Document } from 'mongoose';
import { WritingQuestionType } from '../types';

export interface IWritingQuestion extends Document {
  type: WritingQuestionType;
  content: string;
  timeLimit: number;
  wordMin: number;
  wordMax: number;
  isActive: boolean;
  createdAt: Date;
  attemptCount: number;
  avgScore: number;
}

const writingQuestionSchema = new Schema<IWritingQuestion>({
  type: {
    type: String,
    required: true,
    enum: ['summarise_written_text', 'write_essay'],
  },
  // Passage text (SWT) or essay prompt (WE).
  content: { type: String, required: true },
  // Seconds. SWT default: 600. WE default: 1200. (defaults applied in controller per type)
  timeLimit: { type: Number, required: true },
  // Valid word range — immutable, derived from type. SWT: 5–75. WE: 200–300.
  wordMin: { type: Number, required: true },
  wordMax: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  attemptCount: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },
});

export const WritingQuestion = mongoose.model<IWritingQuestion>(
  'WritingQuestion',
  writingQuestionSchema
);
