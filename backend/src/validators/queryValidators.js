import { query } from 'express-validator';

const categories = ['prepared', 'produce', 'packaged', 'bakery', 'other'];
const geoQuery = [
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude is invalid.').toFloat(),
  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude is invalid.').toFloat(),
  query('lat').custom((value, { req }) => (value === undefined) === (req.query.lng === undefined)).withMessage('Provide both latitude and longitude coordinates.'),
  query('radiusKm').optional().isFloat({ min: 1, max: 250 }).withMessage('Search radius must be 1–250 km.').toFloat(),
];

export const donationSearchValidators = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search text is too long.'),
  query('category').optional().isIn(categories).withMessage('Food category is invalid.'),
  query('foodType').optional().isIn(['vegetarian', 'non_vegetarian', 'vegan', 'unknown']).withMessage('Food type is invalid.'),
  query('city').optional().trim().isLength({ min: 1, max: 80 }).withMessage('City is invalid.'),
  query('before').optional().isISO8601().withMessage('Deadline filter must be a valid date.'),
  query('sort').optional().isIn(['newest', 'deadline', 'distance']).withMessage('Sort is invalid.'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Page size must be between 1 and 50.').toInt(),
  ...geoQuery,
];

export const nearbySearchValidators = [
  ...geoQuery,
  query('lat').exists().withMessage('Latitude is required for nearby search.').isFloat({ min: -90, max: 90 }).toFloat(),
  query('lng').exists().withMessage('Longitude is required for nearby search.').isFloat({ min: -180, max: 180 }).toFloat(),
];

export const ngoSearchValidators = [
  query('city').optional().trim().isLength({ min: 1, max: 80 }).withMessage('City is invalid.'),
  query('category').optional().isIn(categories).withMessage('Food category is invalid.'),
  ...geoQuery,
];
