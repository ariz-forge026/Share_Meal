import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { changePassword, currentUser, login, logout, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginValidators, registerValidators } from '../validators/authValidators.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Too many authentication attempts. Please try again later.' } });

router.post('/register', authLimiter, requireDatabase, registerValidators, validateRequest, asyncHandler(register));
router.post('/login', authLimiter, requireDatabase, loginValidators, validateRequest, asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/me', requireDatabase, authenticate, asyncHandler(currentUser));
router.post('/change-password', requireDatabase, authenticate, [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 8, max: 128 }).withMessage('New password must be at least 8 characters.'),
], validateRequest, asyncHandler(changePassword));

export default router;
