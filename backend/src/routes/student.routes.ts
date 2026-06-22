import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateObjectId } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createStudentSchema,
  updateStudentSchema,
  resetStudentPasswordSchema,
  toggleStudentStatusSchema,
} from '../validators/student.validators';

const router = Router();

router.use(authenticate, authorize('admin'));

router.post('/', validateBody(createStudentSchema), asyncHandler(studentController.createStudent));
router.get('/', asyncHandler(studentController.listStudents));
router.get('/:id', validateObjectId(), asyncHandler(studentController.getStudent));
router.put('/:id', validateObjectId(), validateBody(updateStudentSchema), asyncHandler(studentController.updateStudent));
router.patch(
  '/:id/reset-password',
  validateObjectId(),
  validateBody(resetStudentPasswordSchema),
  asyncHandler(studentController.resetStudentPassword)
);
router.patch(
  '/:id/status',
  validateObjectId(),
  validateBody(toggleStudentStatusSchema),
  asyncHandler(studentController.updateStudentStatus)
);
router.delete('/:id', validateObjectId(), asyncHandler(studentController.deleteStudent));

export default router;
