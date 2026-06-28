import { Router } from 'express';
import * as readingController from '../controllers/reading.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateObjectId } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createReadingQuestionSchema,
  updateReadingQuestionSchema,
  toggleReadingStatusSchema,
  evaluateReadingSchema,
} from '../validators/reading.validators';

/**
 * Admin router — mounted at /api/admin/reading.
 * Requires authenticate + authorize('admin'). All JSON bodies.
 */
export const adminReadingRouter = Router();

adminReadingRouter.use(authenticate, authorize('admin'));

adminReadingRouter.post(
  '/questions',
  validateBody(createReadingQuestionSchema),
  asyncHandler(readingController.addQuestion)
);
adminReadingRouter.get('/questions', asyncHandler(readingController.getAllQuestions));
adminReadingRouter.get(
  '/questions/:id',
  validateObjectId(),
  asyncHandler(readingController.getOneQuestion)
);
adminReadingRouter.put(
  '/questions/:id',
  validateObjectId(),
  validateBody(updateReadingQuestionSchema),
  asyncHandler(readingController.updateQuestion)
);
adminReadingRouter.delete(
  '/questions/:id',
  validateObjectId(),
  asyncHandler(readingController.deleteQuestion)
);
adminReadingRouter.patch(
  '/questions/:id/status',
  validateObjectId(),
  validateBody(toggleReadingStatusSchema),
  asyncHandler(readingController.toggleStatus)
);

/**
 * Student router — mounted at /api/reading.
 * Requires authenticate.
 */
const router = Router();

router.use(authenticate);

// Browse / pick a question of a type.
router.get('/questions/:type', asyncHandler(readingController.listQuestionsByType));

// Single evaluate endpoint for all 5 types (POST — declared before generic GETs).
router.post('/evaluate', validateBody(evaluateReadingSchema), asyncHandler(readingController.evaluate));

// `random` must be declared before `:id` so it is not captured as an id.
router.get('/:type/random', asyncHandler(readingController.getRandomQuestion));
router.get('/:type/:id', validateObjectId(), asyncHandler(readingController.getQuestion));

export default router;
