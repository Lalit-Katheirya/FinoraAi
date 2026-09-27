import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { avatarUpload } from '../middleware/upload.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validators';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', authenticate, authController.me);
router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile
);
router.post(
  '/avatar',
  authenticate,
  avatarUpload.single('avatar'),
  authController.uploadAvatar
);
router.delete('/avatar', authenticate, authController.removeAvatar);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);
router.delete('/account', authenticate, authController.deleteAccount);

export default router;
