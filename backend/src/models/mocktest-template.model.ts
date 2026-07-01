import mongoose, { Schema, Document } from 'mongoose';

export type MockTestModule = 'speaking' | 'writing' | 'reading' | 'listening';

/** One generation rule: pick `count` active questions of `type` from `module`. */
export interface IQuestionRule {
  module: MockTestModule;
  type: string;
  count: number;
}

export interface IMockTestTemplate extends Document {
  name: string;
  description: string;
  totalTime: number;
  questionRules: IQuestionRule[];
  isActive: boolean;
  createdAt: Date;
  attemptCount: number;
  avgScore: number;
}

const questionRuleSchema = new Schema<IQuestionRule>(
  {
    module: {
      type: String,
      required: true,
      enum: ['speaking', 'writing', 'reading', 'listening'],
    },
    type: { type: String, required: true, trim: true },
    count: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const mockTestTemplateSchema = new Schema<IMockTestTemplate>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  // Total time in minutes.
  totalTime: { type: Number, required: true },
  questionRules: { type: [questionRuleSchema], default: [] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  // Counters only — no per-attempt records are ever stored.
  attemptCount: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },
});

export const MockTestTemplate = mongoose.model<IMockTestTemplate>(
  'MockTestTemplate',
  mockTestTemplateSchema
);
