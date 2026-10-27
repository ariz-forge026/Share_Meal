import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js';

const router = Router();
router.use(requireDatabase, authenticate);
router.get('/', asyncHandler(listNotifications));
router.patch('/read-all', asyncHandler(markAllNotificationsRead));
router.patch('/:id/read', param('id').isMongoId().withMessage('Notification ID is invalid.'), validateRequest, asyncHandler(markNotificationRead));

export default router;
