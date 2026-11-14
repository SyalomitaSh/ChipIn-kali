import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { updateProfileSchema } from '../validators/auth.validator.js';
import * as user from '../controllers/user.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/me', h(user.getMe));
router.patch('/me', validate({ body: updateProfileSchema }), h(user.updateMe));

export default router;
