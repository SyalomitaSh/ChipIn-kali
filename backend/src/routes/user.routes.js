
import { Router } from 'express';

import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { uploadAvatar } from '../middlewares/uploadAvatar.js';

import { updateProfileSchema } from '../validators/user.validator.js';
import * as user from '../controllers/user.controller.js';

const router = Router();

// Semua endpoint membutuhkan autentikasi.
router.use(requireAuth);

// GET /api/users/me
router.get('/me', h(user.getMe));

// PATCH /api/users/me
router.patch('/me', uploadAvatar, validate({ body: updateProfileSchema }), h(user.updateMe));

export default router;