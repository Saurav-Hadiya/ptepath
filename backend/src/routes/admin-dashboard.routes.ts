import { Router } from 'express';
import * as adminDashboardController from '../controllers/admin-dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Admin dashboard router — mounted at /api/admin.
 * Requires authenticate + authorize('admin').
 */
const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard-stats', asyncHandler(adminDashboardController.getAdminDashboardStats));

export default router;
