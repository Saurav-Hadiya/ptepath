import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, authenticateFirstLogin } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '../validators/auth.validators';
import * as authController from '../controllers/auth.controller';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validateBody(loginSchema), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.post(
  '/change-password',
  authenticateFirstLogin,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePasswordFirstLogin)
);
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(authController.resetPassword));
router.post('/update-password', authenticate, validateBody(updatePasswordSchema), asyncHandler(authController.updatePassword));

export default router;
