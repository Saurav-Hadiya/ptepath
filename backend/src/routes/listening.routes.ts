import { Router } from 'express';
import * as listeningController from '../controllers/listening.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateObjectId } from '../middleware/validate';
import { uploadAudio } from '../middleware/upload';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createListeningQuestionSchema,
  updateListeningQuestionSchema,
  toggleListeningStatusSchema,
  evaluateListeningSchema,
} from '../validators/listening.validators';

/**
 * Admin router — mounted at /api/admin/listening.
 * Requires authenticate + authorize('admin').
 * Multer (uploadAudio) runs before validateBody so multipart fields populate
 * req.body first; the audio file is uploaded to Cloudinary as resource_type 'video'.
 */
export const adminListeningRouter = Router();

adminListeningRouter.use(authenticate, authorize('admin'));

adminListeningRouter.post(
  '/questions',
  uploadAudio.single('audio'),
  validateBody(createListeningQuestionSchema),
  asyncHandler(listeningController.addQuestion)
);
adminListeningRouter.get('/questions', asyncHandler(listeningController.getAllQuestions));
adminListeningRouter.get(
  '/questions/:id',
  validateObjectId(),
  asyncHandler(listeningController.getOneQuestion)
);
adminListeningRouter.put(
  '/questions/:id',
  validateObjectId(),
  uploadAudio.single('audio'),
  validateBody(updateListeningQuestionSchema),
  asyncHandler(listeningController.updateQuestion)
);
adminListeningRouter.delete(
  '/questions/:id',
  validateObjectId(),
  asyncHandler(listeningController.deleteQuestion)
);
adminListeningRouter.patch(
  '/questions/:id/status',
  validateObjectId(),
  validateBody(toggleListeningStatusSchema),
  asyncHandler(listeningController.toggleStatus)
);

/**
 * Student router — mounted at /api/listening.
 * Requires authenticate.
 */
const router = Router();

router.use(authenticate);

// Browse / pick a question of a type.
router.get('/questions/:type', asyncHandler(listeningController.listQuestionsByType));

// Single evaluate endpoint for all 8 types (POST — declared before generic GETs).
router.post(
  '/evaluate',
  validateBody(evaluateListeningSchema),
  asyncHandler(listeningController.evaluate)
);

// `random` must be declared before `:id` so it is not captured as an id.
router.get('/:type/random', asyncHandler(listeningController.getRandomQuestion));
router.get('/:type/:id', validateObjectId(), asyncHandler(listeningController.getQuestion));

export default router;
