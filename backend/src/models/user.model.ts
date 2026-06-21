import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'admin';
  isActive: boolean;
  isFirstLogin: boolean;
  tokenVersion: number;
  resetTokenHash: string | null;
  resetTokenExpiry: Date | null;
  createdAt: Date;
  totalAttempts: number;
  totalMockTests: number;
  lastActiveAt: Date | null;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  isFirstLogin: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 0 },
  resetTokenHash: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  totalAttempts: { type: Number, default: 0 },
  totalMockTests: { type: Number, default: 0 },
  lastActiveAt: { type: Date, default: null },
});

export const User = mongoose.model<IUser>('User', userSchema);
