import { Router } from 'express';
import { body, param } from 'express-validator';
import { createVolunteer, getMyNgoProfile, getNgoProfile, listVerifiedNgos, listVolunteers, submitVerificationApplication, updateMyNgoProfile } from '../controllers/ngoController.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verificationApplicationValidators, volunteerValidators } from '../validators/profileValidators.js';
import { ngoProfileValidators } from '../validators/ngoValidators.js';
import { ngoSearchValidators } from '../validators/queryValidators.js';

const router = Router();
router.use(requireDatabase);
router.get('/nearby', ngoSearchValidators, validateRequest, asyncHandler(listVerifiedNgos));
router.get('/my-profile', authenticate, requireRole('ngo'), asyncHandler(getMyNgoProfile));
router.post('/apply', authenticate, requireRole('ngo'), verificationApplicationValidators, validateRequest, asyncHandler(submitVerificationApplication));
router.patch('/profile', authenticate, requireRole('ngo'), ngoProfileValidators, validateRequest, asyncHandler(updateMyNgoProfile));
router.get('/volunteers', authenticate, requireRole('ngo'), asyncHandler(listVolunteers));
router.post('/volunteers', authenticate, requireRole('ngo'), volunteerValidators, validateRequest, asyncHandler(createVolunteer));
router.get('/:id', param('id').isMongoId().withMessage('Organization ID is invalid.'), validateRequest, asyncHandler(getNgoProfile));
router.get('/', ngoSearchValidators, validateRequest, asyncHandler(listVerifiedNgos));

export default router;
