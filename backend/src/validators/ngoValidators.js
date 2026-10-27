import { body, param } from 'express-validator';

const categories = ['prepared', 'produce', 'packaged', 'bakery', 'other'];

export const ngoProfileValidators = [
  body('description').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters.'),
  body('contactPhone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
  body('categoriesAccepted').optional().isArray({ max: 5 }).withMessage('Choose up to five accepted food categories.'),
  body('categoriesAccepted.*').optional().isIn(categories),
  body('operatingHours').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('serviceRadiusKm').optional().isInt({ min: 1, max: 250 }).toInt(),
];

export const volunteerIdParam = [param('id').isMongoId().withMessage('Volunteer ID is invalid.')];
