import { Router } from 'express';
import * as readingController from '../controllers/reading.controller';

const router = Router();

router.get('/', readingController.listQuestions);
router.get('/:id', readingController.getQuestion);
router.post('/evaluate', readingController.submitAnswer);
router.post('/', readingController.createQuestion);
router.put('/:id', readingController.updateQuestion);
router.delete('/:id', readingController.deleteQuestion);

export default router;
