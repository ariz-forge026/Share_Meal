import { Router } from 'express';
import { reviewDonationRequest } from '../controllers/donationController.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { reviewRequestValidators } from '../validators/workflowValidators.js';

const router = Router();
router.use(requireDatabase, authenticate, requireRole('donor'));
router.patch('/:id', reviewRequestValidators, validateRequest, asyncHandler(reviewDonationRequest));

export default router;
