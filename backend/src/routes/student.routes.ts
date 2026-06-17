import { Router } from 'express';
import * as studentController from '../controllers/student.controller';

const router = Router();

router.post('/', studentController.createStudent);
router.get('/', studentController.listStudents);
router.get('/:id', studentController.getStudent);
router.put('/:id', studentController.updateStudent);
router.patch('/:id/reset-password', studentController.resetStudentPassword);
router.patch('/:id/status', studentController.updateStudentStatus);
router.delete('/:id', studentController.deleteStudent);

export default router;
