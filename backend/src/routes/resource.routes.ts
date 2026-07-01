import { Router } from 'express';
import * as resourceController from '../controllers/resource.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateObjectId } from '../middleware/validate';
import { uploadResource } from '../middleware/upload';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createResourceSchema,
  updateResourceSchema,
  toggleResourceStatusSchema,
} from '../validators/resource.validators';

/**
 * Admin router — mounted at /api/admin/resources.
 * Requires authenticate + authorize('admin').
 * File upload routes use multipart/form-data via uploadResource middleware.
 */
export const adminResourceRouter = Router();

adminResourceRouter.use(authenticate, authorize('admin'));

adminResourceRouter.post(
  '/',
  uploadResource.single('file'),
  validateBody(createResourceSchema),
  asyncHandler(resourceController.addResource)
);
adminResourceRouter.get('/', asyncHandler(resourceController.getAllResources));
adminResourceRouter.get('/:id', validateObjectId(), asyncHandler(resourceController.getOneResource));
adminResourceRouter.put(
  '/:id',
  validateObjectId(),
  validateBody(updateResourceSchema),
  asyncHandler(resourceController.updateResource)
);
adminResourceRouter.delete(
  '/:id',
  validateObjectId(),
  asyncHandler(resourceController.deleteResource)
);
adminResourceRouter.patch(
  '/:id/status',
  validateObjectId(),
  validateBody(toggleResourceStatusSchema),
  asyncHandler(resourceController.toggleStatus)
);

/**
 * Student router — mounted at /api/resources.
 * Requires authenticate only.
 */
const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(resourceController.listResources));
router.get('/:id', validateObjectId(), asyncHandler(resourceController.getResource));

export default router;
