import { Router } from 'express';
import { scheduleCollection, listMyTasks, updateCollectionTask } from '../controllers/collectionTaskController.js';
import { authenticate, requireRole, requireVerifiedNgo } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { scheduleTaskValidators, updateTaskValidators } from '../validators/workflowValidators.js';

const router = Router();
router.use(requireDatabase, authenticate);
router.get('/my-tasks', requireRole('ngo', 'volunteer'), asyncHandler(listMyTasks));
router.post('/', requireRole('ngo'), requireVerifiedNgo, scheduleTaskValidators, validateRequest, asyncHandler(scheduleCollection));
router.patch('/:id', requireRole('volunteer'), updateTaskValidators, validateRequest, asyncHandler(updateCollectionTask));

export default router;
