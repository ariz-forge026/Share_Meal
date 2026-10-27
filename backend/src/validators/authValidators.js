import { body } from 'express-validator';

const email = body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail();

export const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  email,
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters.'),
  body('role').isIn(['donor', 'ngo']).withMessage('Choose donor or NGO as your account type.'),
  body('donorType').optional().isIn(['individual', 'restaurant', 'hotel', 'cafe', 'caterer', 'grocery', 'food_shop', 'event_organizer', 'other']).withMessage('Choose a valid donor type.'),
  body('businessName').optional().trim().isLength({ max: 120 }).withMessage('Business name must be at most 120 characters.'),
  body('organizationName').if(body('role').equals('ngo')).trim().isLength({ min: 2, max: 120 }).withMessage('Organization name is required for NGO accounts.'),
  body('address').if(body('role').equals('ngo')).trim().isLength({ min: 5, max: 250 }).withMessage('Organization address is required for NGO accounts.'),
  body('city').if(body('role').equals('ngo')).trim().isLength({ min: 2, max: 80 }).withMessage('City is required for NGO accounts.'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be at most 500 characters.'),
];

export const loginValidators = [
  email,
  body('password').isString().notEmpty().withMessage('Password is required.'),
];
