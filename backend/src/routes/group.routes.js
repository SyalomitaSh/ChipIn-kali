import { Router } from 'express';

import { requireAuth } from '../middlewares/auth.js';
import { requireGroupMember } from '../middlewares/groupAccess.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createGroupSchema,
  getMyGroupsQuerySchema,
} from '../validators/group.validator.js';
import {
  joinCodeParamsSchema,
  joinGroupSchema,
} from '../validators/groupInvitation.validator.js';
import * as groupController from '../controllers/group.controller.js';
import * as groupInvitationController from '../controllers/groupInvitation.controller.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  validate({ query: getMyGroupsQuerySchema }),
  asyncHandler(groupController.getMyGroups)
);

router.get(
  '/backgrounds',
  requireAuth,
  asyncHandler(groupController.getGroupBackgrounds)
);

// Public preview so users can validate a shared link before login/register.
router.get(
  '/join/:joinCode',
  validate({ params: joinCodeParamsSchema }),
  asyncHandler(groupInvitationController.getJoinGroupPreview)
);

// User must authenticate before becoming a group member.
router.post(
  '/join',
  requireAuth,
  validate({ body: joinGroupSchema }),
  asyncHandler(groupInvitationController.joinGroupByCode)
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
