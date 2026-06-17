import { Router } from 'express';
import * as speakingController from '../controllers/speaking.controller';

const router = Router();

router.get('/', speakingController.listQuestions);
router.get('/:id', speakingController.getQuestion);
router.post('/evaluate', speakingController.submitAnswer);
router.post('/', speakingController.createQuestion);
router.put('/:id', speakingController.updateQuestion);
router.delete('/:id', speakingController.deleteQuestion);

export default router;
