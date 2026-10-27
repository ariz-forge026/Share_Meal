import { body, param } from 'express-validator';

export const donationIdValidator = [param('id').isMongoId().withMessage('Donation ID is invalid.')];

export const createRequestValidators = [
  ...donationIdValidator,
  body('message').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Request message must be at most 500 characters.'),
];

export const reviewRequestValidators = [
  param('id').isMongoId().withMessage('Request ID is invalid.'),
  body('status').isIn(['accepted', 'rejected']).withMessage('Request status must be accepted or rejected.'),
];

export const scheduleTaskValidators = [
  body('donationId').isMongoId().withMessage('Donation ID is invalid.'),
  body('volunteerId').isMongoId().withMessage('Volunteer ID is invalid.'),
  body('scheduledAt').isISO8601().withMessage('Scheduled time must be a valid date.').toDate(),
];

export const updateTaskValidators = [
  param('id').isMongoId().withMessage('Task ID is invalid.'),
  body('status').equals('collected').withMessage('Collection task status must be collected.'),
  body('confirmationNote').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
];

export const distributionValidators = [
  ...donationIdValidator,
  body('distributedAt').optional().isISO8601().withMessage('Distribution date must be valid.').toDate(),
  body('quantityDistributed').isFloat({ min: 0.01 }).withMessage('Distributed quantity must be greater than zero.').toFloat(),
  body('recipientsEstimate').isInt({ min: 0, max: 100000 }).withMessage('Recipient estimate must be between 0 and 100000.').toInt(),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
];
