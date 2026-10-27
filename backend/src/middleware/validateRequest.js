import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

export function validateRequest(request, response, next) {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const details = errors.array().map(({ path, msg }) => ({ field: path, message: msg }));
    return next(new AppError(400, JSON.stringify(details)));
  }
  return next();
}
