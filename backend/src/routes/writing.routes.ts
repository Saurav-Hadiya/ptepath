import { Router } from 'express';
import * as writingController from '../controllers/writing.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateObjectId } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createWritingQuestionSchema,
  updateWritingQuestionSchema,
  toggleWritingStatusSchema,
  evaluateWritingSchema,
} from '../validators/writing.validators';

/**
 * Admin router — mounted at /api/admin/writing.
 * Requires authenticate + authorize('admin'). All JSON bodies.
 */
export const adminWritingRouter = Router();

adminWritingRouter.use(authenticate, authorize('admin'));

adminWritingRouter.post(
  '/questions',
  validateBody(createWritingQuestionSchema),
  asyncHandler(writingController.addQuestion)
);
adminWritingRouter.get('/questions', asyncHandler(writingController.getAllQuestions));
adminWritingRouter.get(
  '/questions/:id',
  validateObjectId(),
  asyncHandler(writingController.getOneQuestion)
);
adminWritingRouter.put(
  '/questions/:id',
  validateObjectId(),
  validateBody(updateWritingQuestionSchema),
  asyncHandler(writingController.updateQuestion)
);
adminWritingRouter.delete(
  '/questions/:id',
  validateObjectId(),
  asyncHandler(writingController.deleteQuestion)
);
adminWritingRouter.patch(
  '/questions/:id/status',
  validateObjectId(),
  validateBody(toggleWritingStatusSchema),
  asyncHandler(writingController.toggleStatus)
);

/**
 * Student router — mounted at /api/writing.
 * Requires authenticate.
 */
const router = Router();

router.use(authenticate);

// Browse / pick a question of a type.
router.get('/questions/:type', asyncHandler(writingController.listQuestionsByType));

// Evaluate routes are POST — declared before the generic GET /:type/:id.
router.post(
  '/evaluate/summarise',
  validateBody(evaluateWritingSchema),
  asyncHandler(writingController.evaluateSummarise)
);
router.post(
  '/evaluate/essay',
  validateBody(evaluateWritingSchema),
  asyncHandler(writingController.evaluateEssay)
);

// `random` must be declared before `:id` so it is not captured as an id.
router.get('/:type/random', asyncHandler(writingController.getRandomQuestion));
router.get('/:type/:id', validateObjectId(), asyncHandler(writingController.getQuestion));

export default router;
