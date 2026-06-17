import mongoose, { Schema } from 'mongoose';

const speakingQuestionSchema = new Schema({});

export const SpeakingQuestion = mongoose.model('SpeakingQuestion', speakingQuestionSchema);
