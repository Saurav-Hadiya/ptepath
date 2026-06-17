import { Router } from 'express';
import * as mocktestController from '../controllers/mocktest.controller';

const router = Router();

router.get('/', mocktestController.listTemplates);
router.get('/:id', mocktestController.getTemplate);
router.post('/attempt', mocktestController.startAttempt);
router.post('/attempt/submit', mocktestController.submitAttempt);
router.post('/', mocktestController.createTemplate);
router.put('/:id', mocktestController.updateTemplate);
router.delete('/:id', mocktestController.deleteTemplate);

export default router;
