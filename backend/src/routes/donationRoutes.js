import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  cancelDonation, createDonation, deleteDonation, getDonation, listDonationRequests,
  listDonations, listMyDonations, listNearbyDonations, requestDonation, updateDonation,
} from '../controllers/donationController.js';
import { recordDistribution, listDistributionHistory } from '../controllers/distributionController.js';
import { authenticate, requireRole, requireVerifiedNgo } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createDonationValidators, idValidator, updateDonationValidators } from '../validators/donationValidators.js';
import { createRequestValidators, distributionValidators } from '../validators/workflowValidators.js';
import { param } from 'express-validator';
import { donationSearchValidators, nearbySearchValidators } from '../validators/queryValidators.js';

const router = Router();
const mutationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Too many requests. Please try again later.' } });

router.use(requireDatabase);
router.get('/', donationSearchValidators, validateRequest, asyncHandler(listDonations));
router.get('/nearby', nearbySearchValidators, validateRequest, asyncHandler(listNearbyDonations));
router.get('/mine', authenticate, requireRole('donor', 'ngo'), asyncHandler(listMyDonations));
router.get('/my-donations', authenticate, requireRole('donor', 'ngo'), asyncHandler(listMyDonations));
router.get('/:id/requests', authenticate, requireRole('donor', 'ngo'), idValidator, validateRequest, asyncHandler(listDonationRequests));
router.post('/:id/requests', mutationLimiter, authenticate, requireVerifiedNgo, createRequestValidators, validateRequest, asyncHandler(requestDonation));
router.post('/:id/request', mutationLimiter, authenticate, requireVerifiedNgo, createRequestValidators, validateRequest, asyncHandler(requestDonation));
router.get('/:id', idValidator, validateRequest, asyncHandler(getDonation));
router.post('/', mutationLimiter, authenticate, requireRole('donor'), createDonationValidators, validateRequest, asyncHandler(createDonation));
router.patch('/:id', mutationLimiter, authenticate, requireRole('donor'), idValidator, updateDonationValidators, validateRequest, asyncHandler(updateDonation));
router.delete('/:id', mutationLimiter, authenticate, requireRole('donor'), idValidator, validateRequest, asyncHandler(deleteDonation));
router.post('/:id/cancel', mutationLimiter, authenticate, requireRole('donor'), idValidator, validateRequest, asyncHandler(cancelDonation));
router.post('/:id/distribution', mutationLimiter, authenticate, requireVerifiedNgo, distributionValidators, validateRequest, asyncHandler(recordDistribution));
export default router;
