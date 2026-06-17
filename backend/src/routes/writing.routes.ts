import { Router } from 'express';
import * as writingController from '../controllers/writing.controller';

const router = Router();

router.get('/', writingController.listQuestions);
router.get('/:id', writingController.getQuestion);
router.post('/evaluate', writingController.submitAnswer);
router.post('/', writingController.createQuestion);
router.put('/:id', writingController.updateQuestion);
router.delete('/:id', writingController.deleteQuestion);

export default router;
