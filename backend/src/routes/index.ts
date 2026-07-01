import { Router } from 'express';

import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import speakingRoutes, { adminSpeakingRouter } from './speaking.routes';
import writingRoutes, { adminWritingRouter } from './writing.routes';
import readingRoutes, { adminReadingRouter } from './reading.routes';
import listeningRoutes, { adminListeningRouter } from './listening.routes';
import mocktestRoutes, { adminMocktestRouter } from './mocktest.routes';
import resourceRoutes, { adminResourceRouter } from './resource.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin/students', studentRoutes);
router.use('/admin/speaking', adminSpeakingRouter);
router.use('/speaking', speakingRoutes);
router.use('/admin/writing', adminWritingRouter);
router.use('/writing', writingRoutes);
router.use('/admin/reading', adminReadingRouter);
router.use('/reading', readingRoutes);
router.use('/admin/listening', adminListeningRouter);
router.use('/listening', listeningRoutes);
router.use('/admin/mock-tests', adminMocktestRouter);
router.use('/mock-tests', mocktestRoutes);
router.use('/admin/resources', adminResourceRouter);
router.use('/resources', resourceRoutes);

export default router;
