import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { updateMyProfile, getMyProfile } from '../controllers/userController.js';
import { profileValidators } from '../validators/profileValidators.js';

const router = Router();
router.use(requireDatabase, authenticate);
router.get('/me', asyncHandler(getMyProfile));
router.patch('/me', profileValidators, validateRequest, asyncHandler(updateMyProfile));

export default router;
