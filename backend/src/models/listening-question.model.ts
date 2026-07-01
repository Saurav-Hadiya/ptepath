import mongoose, { Schema, Document } from 'mongoose';
import { ListeningQuestionType } from '../types';

export interface IListeningOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface IListeningBlank {
  position: number;
  correctWord: string;
}

export interface IListeningQuestion extends Document {
  type: ListeningQuestionType;
  audioUrl: string;
  audioPublicId: string;
  playLimit: number;
  question: string | null;
  options: IListeningOption[];
  transcript: string | null;
  blanks: IListeningBlank[];
  incorrectWordIndices: number[];
  correctSentence: string | null;
  isActive: boolean;
  createdAt: Date;
  attemptCount: number;
  avgScore: number;
}

// MCQ + summary types (mcq_multiple, mcq_single, highlight_summary, select_missing).
const optionSchema = new Schema<IListeningOption>(
  {
    label: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

// fill_blanks only — fuzzy-matched against the student's typed word.
const blankSchema = new Schema<IListeningBlank>(
  {
    position: { type: Number, required: true },
    correctWord: { type: String, required: true },
  },
  { _id: false }
);

const listeningQuestionSchema = new Schema<IListeningQuestion>({
  type: {
    type: String,
    required: true,
    enum: [
      'summarise_spoken',
      'mcq_multiple',
      'fill_blanks',
      'highlight_summary',
      'mcq_single',
      'select_missing',
      'highlight_incorrect',
      'write_dictation',
    ],
  },
  // Cloudinary URL + public ID (resource_type 'video') for the uploaded audio file.
  audioUrl: { type: String, required: true },
  audioPublicId: { type: String, required: true },
  // 1 = play once (default), 0 = unlimited replays.
  playLimit: { type: Number, default: 1, enum: [0, 1] },
  // Question text — MCQ types only; null for the rest.
  question: { type: String, default: null },
  options: { type: [optionSchema], default: [] },
  // Full transcript — fill_blanks and highlight_incorrect only.
  transcript: { type: String, default: null },
  blanks: { type: [blankSchema], default: [] },
  // highlight_incorrect only — word position indices that differ from the audio.
  incorrectWordIndices: { type: [Number], default: [] },
  // write_dictation only — the exact spoken sentence used for scoring.
  correctSentence: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  attemptCount: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },
});

export const ListeningQuestion = mongoose.model<IListeningQuestion>(
  'ListeningQuestion',
  listeningQuestionSchema
);
