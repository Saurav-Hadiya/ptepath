import { Router } from 'express';
import * as listeningController from '../controllers/listening.controller';

const router = Router();

router.get('/', listeningController.listQuestions);
router.get('/:id', listeningController.getQuestion);
router.post('/evaluate', listeningController.submitAnswer);
router.post('/', listeningController.createQuestion);
router.put('/:id', listeningController.updateQuestion);
router.delete('/:id', listeningController.deleteQuestion);

export default router;
