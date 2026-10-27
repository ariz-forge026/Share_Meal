import { Router } from 'express';
import { body, param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { getDashboard, getNgosForReview, getPendingNgos, listAdminContactMessages, listAdminDonations, listAuditLogs, moderateContactMessage, updateNgoVerification } from '../controllers/adminController.js';
import { listUsers, updateUserStatus } from '../controllers/userController.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });

router.use(adminLimiter, requireDatabase, authenticate, requireRole('admin'));
router.get('/dashboard', asyncHandler(getDashboard));
router.get('/ngos', asyncHandler(getNgosForReview));
router.get('/ngos/pending', asyncHandler(getPendingNgos));
router.get('/users', asyncHandler(listUsers));
router.patch('/users/:id/status', param('id').isMongoId().withMessage('User ID is invalid.'), body('accountStatus').isIn(['active', 'suspended', 'disabled']).withMessage('Account status is invalid.'), validateRequest, asyncHandler(updateUserStatus));
router.get('/donations', asyncHandler(listAdminDonations));
router.get('/audit-logs', asyncHandler(listAuditLogs));
router.get('/contact-messages', asyncHandler(listAdminContactMessages));
router.patch('/contact-messages/:id', param('id').isMongoId().withMessage('Message ID is invalid.'), body('status').isIn(['reviewed', 'closed']).withMessage('Status is invalid.'), validateRequest, asyncHandler(moderateContactMessage));
router.patch(
  '/ngos/:id/verification',
  param('id').isMongoId().withMessage('NGO ID is invalid.'),
  body('status').isIn(['approved', 'rejected', 'needs_more_information']).withMessage('Choose an allowed verification decision.'),
  body('decisionNote').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Decision note is too long.'),
  validateRequest,
  asyncHandler(updateNgoVerification),
);

export default router;
