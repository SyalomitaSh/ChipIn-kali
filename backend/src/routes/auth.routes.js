import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from '../validators/auth.validator.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak percobaan, coba lagi nanti',
    },
  },
});

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);

router.post(
  '/refresh',
  authLimiter,
  validate({ body: refreshSchema }),
  asyncHandler(authController.refresh)
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(authController.logout)
);

export default router;
