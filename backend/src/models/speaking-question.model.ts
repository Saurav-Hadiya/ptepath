import mongoose, { Schema, Document } from 'mongoose';
import { SpeakingQuestionType } from '../types';

export interface ISpeakingQuestion extends Document {
  type: SpeakingQuestionType;
  content: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  acceptedAnswers: string[];
  speakingTime: number;
  preparationTime: number;
  isActive: boolean;
  createdAt: Date;
  attemptCount: number;
  avgScore: number;
}

const speakingQuestionSchema = new Schema<ISpeakingQuestion>({
  type: {
    type: String,
    required: true,
    enum: ['read_aloud', 'repeat_sentence', 'describe_image', 'respond_situation', 'answer_short'],
  },
  // Required for every text-based type. describe_image is image-only, so content
  // is not required there (see per-type validation in the controller).
  content: {
    type: String,
    required: function (this: ISpeakingQuestion): boolean {
      return this.type !== 'describe_image';
    },
  },
  imageUrl: { type: String, default: null },
  imagePublicId: { type: String, default: null },
  acceptedAnswers: { type: [String], default: [] },
  speakingTime: { type: Number, required: true },
  preparationTime: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  attemptCount: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },
});

export const SpeakingQuestion = mongoose.model<ISpeakingQuestion>(
  'SpeakingQuestion',
  speakingQuestionSchema
);
