import mongoose, { Schema } from 'mongoose';

const writingQuestionSchema = new Schema({});

export const WritingQuestion = mongoose.model('WritingQuestion', writingQuestionSchema);
