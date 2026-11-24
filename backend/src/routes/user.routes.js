import { Router } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { uploadAvatar } from '../middlewares/uploadAvatar.js';
import { updateProfileSchema } from '../validators/user.validator.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

// Semua endpoint user membutuhkan autentikasi.
router.use(requireAuth);

router.get('/me', asyncHandler(userController.getMe));

router.patch(
  '/me',
  uploadAvatar,
  validate({ body: updateProfileSchema }),
  asyncHandler(userController.updateMe)
);

export default router;
