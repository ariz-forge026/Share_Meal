import { body, param } from 'express-validator';

const donationId = param('id').isMongoId().withMessage('Donation ID is invalid.');

export const createDonationValidators = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters.'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters.'),
  body('category').isIn(['prepared', 'produce', 'packaged', 'bakery', 'other']).withMessage('Choose a valid food category.'),
  body('quantity').isFloat({ min: 0.01, max: 10000 }).withMessage('Quantity must be between 0.01 and 10000.').toFloat(),
  body('unit').isIn(['portions', 'kg', 'boxes', 'items']).withMessage('Choose a valid quantity unit.'),
  body('pickupAddress').trim().isLength({ min: 5, max: 250 }).withMessage('Pickup address must be between 5 and 250 characters.'),
  body('city').trim().isLength({ min: 2, max: 80 }).withMessage('City must be between 2 and 80 characters.'),
  body('expiresAt').isISO8601().withMessage('Enter a valid pickup deadline.').toDate().custom((date) => date > new Date()).withMessage('Pickup deadline must be in the future.'),
  body('peopleServedEstimate').optional({ values: 'falsy' }).isInt({ min: 0, max: 100000 }).withMessage('Portion estimate must be between 0 and 100000.').toInt(),
  body('foodType').optional().isIn(['vegetarian', 'non_vegetarian', 'vegan', 'unknown']).withMessage('Food type is invalid.'),
  body('preparedAt').optional({ values: 'falsy' }).isISO8601().withMessage('Preparation time must be valid.').toDate(),
  body('useBy').optional({ values: 'falsy' }).isISO8601().withMessage('Use-by time must be valid.').toDate(),
  body('storageRequirements').optional({ values: 'falsy' }).trim().isLength({ max: 300 }),
  body('allergens').optional().isArray({ max: 30 }).withMessage('Provide up to 30 allergen labels.'),
  body('allergens.*').optional().trim().isLength({ max: 60 }),
  body('packagingCondition').optional().isIn(['sealed', 'intact', 'needs_review', 'not_applicable']),
  body('handlingInstructions').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude is invalid.').toFloat(),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude is invalid.').toFloat(),
  body('latitude').custom((value, { req }) => (value === undefined) === (req.body.longitude === undefined)).withMessage('Provide both latitude and longitude coordinates.'),
];

export const updateDonationValidators = [
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('category').optional().isIn(['prepared', 'produce', 'packaged', 'bakery', 'other']),
  body('quantity').optional().isFloat({ min: 0.01, max: 10000 }).toFloat(),
  body('unit').optional().isIn(['portions', 'kg', 'boxes', 'items']),
  body('peopleServedEstimate').optional().isInt({ min: 0, max: 100000 }).toInt(),
  body('foodType').optional().isIn(['vegetarian', 'non_vegetarian', 'vegan', 'unknown']),
  body('preparedAt').optional().isISO8601().toDate(),
  body('useBy').optional().isISO8601().toDate(),
  body('storageRequirements').optional().trim().isLength({ max: 300 }),
  body('allergens').optional().isArray({ max: 30 }),
  body('allergens.*').optional().trim().isLength({ max: 60 }),
  body('packagingCondition').optional().isIn(['sealed', 'intact', 'needs_review', 'not_applicable']),
  body('handlingInstructions').optional().trim().isLength({ max: 500 }),
  body('pickupAddress').optional().trim().isLength({ min: 5, max: 250 }),
  body('city').optional().trim().isLength({ min: 2, max: 80 }),
  body('expiresAt').optional().isISO8601().toDate().custom((date) => date > new Date()),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).toFloat(),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).toFloat(),
  body('title').custom((_value, { req }) => Object.keys(req.body).some((key) => [
    'title', 'description', 'category', 'quantity', 'unit', 'peopleServedEstimate',
    'foodType', 'preparedAt', 'useBy', 'storageRequirements', 'allergens',
    'packagingCondition', 'handlingInstructions', 'pickupAddress', 'city', 'expiresAt',
    'latitude', 'longitude',
  ].includes(key))).withMessage('Provide at least one recognized field to update.'),
  body('latitude').custom((value, { req }) => (value === undefined) === (req.body.longitude === undefined)).withMessage('Provide both latitude and longitude coordinates.'),
];

export const idValidator = [donationId];
