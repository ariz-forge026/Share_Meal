import { Router } from 'express';
import { getMyDashboard } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/', requireDatabase, authenticate, asyncHandler(getMyDashboard));

export default router;
