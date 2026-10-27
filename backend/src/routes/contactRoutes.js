import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { createContactMessage } from '../controllers/contactController.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false });
router.post('/', contactLimiter, requireDatabase,
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters.'),
  validateRequest, asyncHandler(createContactMessage));

export default router;
