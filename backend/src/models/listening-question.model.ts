import mongoose, { Schema } from 'mongoose';

const listeningQuestionSchema = new Schema({});

export const ListeningQuestion = mongoose.model('ListeningQuestion', listeningQuestionSchema);
