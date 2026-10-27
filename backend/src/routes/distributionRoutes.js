import { Router } from 'express';
import { listDistributionHistory } from '../controllers/distributionController.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/my-history', requireDatabase, authenticate, requireRole('ngo'), asyncHandler(listDistributionHistory));

export default router;
