import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.js';
import { requireGroupMember } from '../middlewares/groupAccess.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createGroupSchema } from '../validators/group.validator.js';
import * as groupController from '../controllers/group.controller.js';

const router = Router();

router.get(
  '/backgrounds',
  requireAuth,
  asyncHandler(groupController.getGroupBackgrounds)
);

router.get(
  '/:groupId/members',
  requireAuth,
  requireGroupMember({ param: 'groupId' }),
  asyncHandler(groupController.getGroupMembers)
);

router.post(
  '/',
  requireAuth,
  validate({ body: createGroupSchema }),
  asyncHandler(groupController.createGroup)
);

export default router;
