import { Router } from 'express';

import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import speakingRoutes, { adminSpeakingRouter } from './speaking.routes';
import writingRoutes, { adminWritingRouter } from './writing.routes';
import readingRoutes, { adminReadingRouter } from './reading.routes';
import listeningRoutes from './listening.routes';
import mocktestRoutes from './mocktest.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin/students', studentRoutes);
router.use('/admin/speaking', adminSpeakingRouter);
router.use('/speaking', speakingRoutes);
router.use('/admin/writing', adminWritingRouter);
router.use('/writing', writingRoutes);
router.use('/admin/reading', adminReadingRouter);
router.use('/reading', readingRoutes);
router.use('/listening', listeningRoutes);
router.use('/mock-tests', mocktestRoutes);

export default router;
