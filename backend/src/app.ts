import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import speakingRoutes from './routes/speaking.routes';
import writingRoutes from './routes/writing.routes';
import readingRoutes from './routes/reading.routes';
import listeningRoutes from './routes/listening.routes';
import mocktestRoutes from './routes/mocktest.routes';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin/students', studentRoutes);
app.use('/api/speaking', speakingRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/listening', listeningRoutes);
app.use('/api/mock-tests', mocktestRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
