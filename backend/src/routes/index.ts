import { Router } from 'express';

import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import speakingRoutes from './speaking.routes';
import writingRoutes from './writing.routes';
import readingRoutes from './reading.routes';
import listeningRoutes from './listening.routes';
import mocktestRoutes from './mocktest.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin/students', studentRoutes);
router.use('/speaking', speakingRoutes);
router.use('/writing', writingRoutes);
router.use('/reading', readingRoutes);
router.use('/listening', listeningRoutes);
router.use('/mock-tests', mocktestRoutes);

export default router;
