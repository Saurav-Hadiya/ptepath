import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Student self-service router — mounted at /api/student.
 * Requires authenticate only (not authorize('admin')).
 * Distinct from student.routes.ts, which is the admin-facing student
 * management CRUD router mounted at /api/admin/students.
 */
const router = Router();

router.use(authenticate);

router.get('/dashboard-stats', asyncHandler(studentController.getStudentDashboardStats));

export default router;
