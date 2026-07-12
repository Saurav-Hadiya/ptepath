import mongoose, { Schema, Document } from 'mongoose';

/**
 * Single-source-of-truth timing/constraint config, keyed by (module, type).
 * Individual question documents no longer store their own copy of these
 * fields — every consumer reads through `services/question-type-config.service.ts`.
 * Reading has no constraint fields; it never gets a row here.
 */
export type ConfigModule = 'speaking' | 'writing' | 'reading' | 'listening';

export interface IQuestionTypeConfig extends Document {
  module: ConfigModule;
  type: string;
  speakingTime?: number; // speaking
  preparationTime?: number; // speaking
  timeLimit?: number; // writing (all types) + listening (summarise_spoken only)
  wordMin?: number; // writing
  wordMax?: number; // writing
  playLimit?: number; // listening
  updatedAt: Date;
}

const questionTypeConfigSchema = new Schema<IQuestionTypeConfig>({
  module: { type: String, required: true, enum: ['speaking', 'writing', 'reading', 'listening'] },
  type: { type: String, required: true, trim: true },
  speakingTime: { type: Number },
  preparationTime: { type: Number },
  timeLimit: { type: Number },
  wordMin: { type: Number },
  wordMax: { type: Number },
  playLimit: { type: Number },
  updatedAt: { type: Date, default: Date.now },
});

questionTypeConfigSchema.index({ module: 1, type: 1 }, { unique: true });

export const QuestionTypeConfig = mongoose.model<IQuestionTypeConfig>(
  'QuestionTypeConfig',
  questionTypeConfigSchema
);
