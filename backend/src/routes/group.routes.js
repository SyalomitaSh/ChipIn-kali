import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

import { createGroupSchema } from '../validators/group.validator.js';
import * as group from '../controllers/group.controller.js';

const router = Router();

// Pilihan background yang tersedia untuk layar Create Group.
router.get('/backgrounds', requireAuth, h(group.getGroupBackgrounds));

// Membuat grup, owner membership, dan undangan terpilih.
router.post('/', requireAuth, validate({ body: createGroupSchema }), h(group.createGroup));

export default router;