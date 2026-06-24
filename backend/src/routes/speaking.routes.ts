import { Router } from 'express';
import * as speakingController from '../controllers/speaking.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateObjectId } from '../middleware/validate';
import { uploadImage, uploadAudioMemory } from '../middleware/upload';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createSpeakingQuestionSchema,
  updateSpeakingQuestionSchema,
  toggleSpeakingStatusSchema,
  evaluateSchema,
  evaluateWithDurationSchema,
} from '../validators/speaking.validators';

/**
 * Admin router — mounted at /api/admin/speaking.
 * Multer runs before validateBody so multipart fields populate req.body first.
 */
export const adminSpeakingRouter = Router();

adminSpeakingRouter.use(authenticate, authorize('admin'));

adminSpeakingRouter.post(
  '/questions',
  uploadImage.single('image'),
  validateBody(createSpeakingQuestionSchema),
  asyncHandler(speakingController.addQuestion)
);
adminSpeakingRouter.get('/questions', asyncHandler(speakingController.getAllQuestions));
adminSpeakingRouter.put(
  '/questions/:id',
  validateObjectId(),
  uploadImage.single('image'),
  validateBody(updateSpeakingQuestionSchema),
  asyncHandler(speakingController.updateQuestion)
);
adminSpeakingRouter.delete(
  '/questions/:id',
  validateObjectId(),
  asyncHandler(speakingController.deleteQuestion)
);
adminSpeakingRouter.patch(
  '/questions/:id/status',
  validateObjectId(),
  validateBody(toggleSpeakingStatusSchema),
  asyncHandler(speakingController.toggleStatus)
);

/**
 * Student router — mounted at /api/speaking.
 */
const router = Router();

router.use(authenticate);

// Browse / pick a question of a type.
router.get('/questions/:type', asyncHandler(speakingController.listQuestionsByType));

// `random` must be declared before `:id` so it is not captured as an id.
router.get('/question/:type/random', asyncHandler(speakingController.getRandomQuestion));
router.get('/question/:type/:id', validateObjectId(), asyncHandler(speakingController.getQuestion));

router.post(
  '/evaluate/read-aloud',
  uploadAudioMemory.single('audio'),
  validateBody(evaluateSchema),
  asyncHandler(speakingController.evaluateReadAloud)
);
router.post(
  '/evaluate/repeat-sentence',
  uploadAudioMemory.single('audio'),
  validateBody(evaluateSchema),
  asyncHandler(speakingController.evaluateRepeatSentence)
);
router.post(
  '/evaluate/describe-image',
  uploadAudioMemory.single('audio'),
  validateBody(evaluateWithDurationSchema),
  asyncHandler(speakingController.evaluateDescribeImage)
);
router.post(
  '/evaluate/respond-situation',
  uploadAudioMemory.single('audio'),
  validateBody(evaluateWithDurationSchema),
  asyncHandler(speakingController.evaluateRespondSituation)
);
router.post(
  '/evaluate/answer-short',
  uploadAudioMemory.single('audio'),
  validateBody(evaluateSchema),
  asyncHandler(speakingController.evaluateAnswerShort)
);

export default router;
