import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, authenticateFirstLogin } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
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

router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticateFirstLogin, validateBody(changePasswordSchema), authController.changePasswordFirstLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);
router.post('/update-password', authenticate, validateBody(updatePasswordSchema), authController.updatePassword);

export default router;
