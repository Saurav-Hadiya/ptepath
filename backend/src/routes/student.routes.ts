import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import {
  createStudentSchema,
  updateStudentSchema,
  resetStudentPasswordSchema,
  toggleStudentStatusSchema,
} from '../validators/student.validators';

const router = Router();

router.use(authenticate, authorize('admin'));

router.post('/', validateBody(createStudentSchema), studentController.createStudent);
router.get('/', studentController.listStudents);
router.get('/:id', studentController.getStudent);
router.put('/:id', validateBody(updateStudentSchema), studentController.updateStudent);
router.patch('/:id/reset-password', validateBody(resetStudentPasswordSchema), studentController.resetStudentPassword);
router.patch('/:id/status', validateBody(toggleStudentStatusSchema), studentController.updateStudentStatus);
router.delete('/:id', studentController.deleteStudent);

export default router;
