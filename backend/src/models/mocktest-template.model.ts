import mongoose, { Schema } from 'mongoose';

const mocktestTemplateSchema = new Schema({});

export const MocktestTemplate = mongoose.model('MocktestTemplate', mocktestTemplateSchema);
