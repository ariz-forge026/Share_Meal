import { body, param } from 'express-validator';

const categories = ['prepared', 'produce', 'packaged', 'bakery', 'other'];

export const profileValidators = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }).withMessage('Phone number is too long.'),
  body('donorType').optional().isIn(['individual', 'restaurant', 'hotel', 'cafe', 'caterer', 'grocery', 'food_shop', 'event_organizer', 'other']).withMessage('Choose a valid donor type.'),
  body('businessName').optional({ values: 'falsy' }).trim().isLength({ max: 120 }).withMessage('Business name is too long.'),
  body('address').optional({ values: 'falsy' }).trim().isLength({ min: 5, max: 250 }).withMessage('Address must be between 5 and 250 characters.'),
  body('city').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 80 }).withMessage('City must be between 2 and 80 characters.'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude is invalid.').toFloat(),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude is invalid.').toFloat(),
  body('clearLocation').optional().isBoolean().withMessage('Location update is invalid.').toBoolean(),
  body('latitude').custom((value, { req }) => (value === undefined) === (req.body.longitude === undefined)).withMessage('Provide both latitude and longitude coordinates.'),
];

export const verificationApplicationValidators = [
  body('legalName').trim().isLength({ min: 2, max: 160 }).withMessage('Legal organization name is required.'),
  body('registrationCategory').trim().isLength({ min: 2, max: 80 }).withMessage('Registration category is required.'),
  body('registrationNumber').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
  body('address').trim().isLength({ min: 5, max: 250 }).withMessage('Address must be at least 5 characters.'),
  body('city').trim().isLength({ min: 2, max: 80 }).withMessage('City is required.'),
  body('contactPhone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters.'),
  body('categoriesAccepted').optional().isArray({ max: 5 }).withMessage('Choose up to five accepted food categories.'),
  body('categoriesAccepted.*').optional().isIn(categories).withMessage('Food category is invalid.'),
  body('operatingHours').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('serviceRadiusKm').optional().isInt({ min: 1, max: 250 }).withMessage('Service radius must be 1–250 km.').toInt(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude is invalid.').toFloat(),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude is invalid.').toFloat(),
  body('latitude').custom((value, { req }) => (value === undefined) === (req.body.longitude === undefined)).withMessage('Provide both latitude and longitude coordinates.'),
];

export const volunteerValidators = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 12, max: 128 }).withMessage('Set an initial password of at least 12 characters.'),
];

export const userIdValidator = [param('id').isMongoId().withMessage('User ID is invalid.')];
