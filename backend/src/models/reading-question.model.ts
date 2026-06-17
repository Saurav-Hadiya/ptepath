import mongoose, { Schema } from 'mongoose';

const readingQuestionSchema = new Schema({});

export const ReadingQuestion = mongoose.model('ReadingQuestion', readingQuestionSchema);
