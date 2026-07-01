import { Router } from 'express';
import * as mocktestController from '../controllers/mocktest.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateObjectId } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createMockTestSchema,
  updateMockTestSchema,
  toggleMockTestStatusSchema,
  submitMockTestSchema,
} from '../validators/mocktest.validators';

/**
 * Admin router — mounted at /api/admin/mock-tests.
 * Requires authenticate + authorize('admin'). All JSON bodies.
 */
export const adminMocktestRouter = Router();

adminMocktestRouter.use(authenticate, authorize('admin'));

adminMocktestRouter.post(
  '/',
  validateBody(createMockTestSchema),
  asyncHandler(mocktestController.createTemplate)
);
adminMocktestRouter.get('/', asyncHandler(mocktestController.getAllTemplates));
adminMocktestRouter.get('/:id', validateObjectId(), asyncHandler(mocktestController.getOneTemplate));
adminMocktestRouter.put(
  '/:id',
  validateObjectId(),
  validateBody(updateMockTestSchema),
  asyncHandler(mocktestController.updateTemplate)
);
adminMocktestRouter.delete(
  '/:id',
  validateObjectId(),
  asyncHandler(mocktestController.deleteTemplate)
);
adminMocktestRouter.patch(
  '/:id/status',
  validateObjectId(),
  validateBody(toggleMockTestStatusSchema),
  asyncHandler(mocktestController.toggleStatus)
);

/**
 * Student router — mounted at /api/mock-tests.
 * Requires authenticate.
 */
const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(mocktestController.getActiveTemplates));
router.get('/:id', validateObjectId(), asyncHandler(mocktestController.getTemplateDetail));
router.post('/:id/start', validateObjectId(), asyncHandler(mocktestController.startMockTest));
router.post(
  '/:id/submit',
  validateObjectId(),
  validateBody(submitMockTestSchema),
  asyncHandler(mocktestController.submitMockTest)
);

export default router;
